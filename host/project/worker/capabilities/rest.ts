// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

// deno-lint-ignore-file no-explicit-any

import { create } from "@bufbuild/protobuf";
import {
  type Filter,
  type FilterGroup,
  FilterOperator,
  FilterSchema,
  Operation,
  type Query,
  type QueryResult,
  QueryResultSchema,
} from "@scribe/sdk/gen/scribe/host/dependencies/database/rest/protocol/rest_pb.ts";
import { PostgrestClients } from "@scribe/core/clients/database/client.ts";
import { ownerOf } from "@scribe/core/clients/database/schema.ts";
import { ownerScope } from "@scribe/core/clients/database/query/scope.ts";
import { decodeJson, encodeJson } from "../json.ts";

function applyOperator(builder: any, filter: Filter): any {
  const value = decodeJson(filter.value);
  const negated = filter.negated ? builder.not : builder;
  const column = filter.column;

  switch (filter.operator) {
    case FilterOperator.EQ:
      return negated.eq(column, value);
    case FilterOperator.NEQ:
      return negated.neq(column, value);
    case FilterOperator.GT:
      return negated.gt(column, value);
    case FilterOperator.GTE:
      return negated.gte(column, value);
    case FilterOperator.LT:
      return negated.lt(column, value);
    case FilterOperator.LTE:
      return negated.lte(column, value);
    case FilterOperator.LIKE:
      return negated.like(column, value);
    case FilterOperator.ILIKE:
      return negated.ilike(column, value);
    case FilterOperator.IN:
      return negated.in(column, value);
    case FilterOperator.IS:
      return negated.is(column, value);
    case FilterOperator.CONTAINS:
      return negated.contains(column, value);
    case FilterOperator.CONTAINED_BY:
      return negated.containedBy(column, value);
    case FilterOperator.OVERLAPS:
      return negated.overlaps(column, value);
    case FilterOperator.TEXT_SEARCH:
      return negated.textSearch(column, value);
    default:
      return builder;
  }
}

function operatorName(operator: FilterOperator): string {
  const names: Partial<Record<FilterOperator, string>> = {
    [FilterOperator.EQ]: "eq",
    [FilterOperator.NEQ]: "neq",
    [FilterOperator.GT]: "gt",
    [FilterOperator.GTE]: "gte",
    [FilterOperator.LT]: "lt",
    [FilterOperator.LTE]: "lte",
    [FilterOperator.LIKE]: "like",
    [FilterOperator.ILIKE]: "ilike",
    [FilterOperator.IN]: "in",
    [FilterOperator.IS]: "is",
  };
  return names[operator] ?? "eq";
}

function disjunction(group: FilterGroup): string {
  return group.filters
    .map((filter) =>
      `${filter.column}.${operatorName(filter.operator)}.${String(decodeJson(filter.value))}`
    )
    .join(",");
}

function applyFilters(builder: any, where: FilterGroup | undefined): any {
  if (!where) return builder;

  let current = builder;
  for (const filter of where.filters) current = applyOperator(current, filter);
  for (const group of where.groups) {
    current = group.disjunction ? current.or(disjunction(group)) : applyFilters(current, group);
  }
  return current;
}

function constrainsOwner(query: Query, column: string): boolean {
  return (query.where?.filters ?? []).some((filter) => filter.column === column);
}

function ownerFilter(query: Query): Filter | null {
  const column = ownerOf(query.table);
  if (column === null) return null;

  const decision = ownerScope(query.table);
  if (decision.kind === "open") return null;

  if (decision.kind === "denied") {
    if (constrainsOwner(query, decision.column)) return null;
    throw new Error(
      `${query.table} is owned by "${decision.column}" and the caller cannot cross owners.`,
    );
  }

  return create(FilterSchema, {
    column: decision.column,
    operator: FilterOperator.EQ,
    value: encodeJson(decision.id),
  });
}

function ownedPayload(query: Query, payload: unknown): unknown {
  const decision = ownerScope(query.table);
  if (decision.kind !== "scoped") return payload;

  const withOwner = (row: Record<string, unknown>) =>
    row[decision.column] === undefined || row[decision.column] === null
      ? { ...row, [decision.column]: decision.id }
      : row;

  return Array.isArray(payload)
    ? payload.map((row) => withOwner(row as Record<string, unknown>))
    : withOwner(payload as Record<string, unknown>);
}

function selection(query: Query): string {
  return query.select.length > 0 ? query.select.join(",") : "*";
}

function started(query: Query, db: any): any {
  const payload = query.payload === undefined ? undefined : decodeJson(query.payload);

  switch (query.operation) {
    case Operation.INSERT:
      return db.from(query.table).insert(ownedPayload(query, payload)).select(selection(query));
    case Operation.UPDATE:
      return db.from(query.table).update(payload).select(selection(query));
    case Operation.UPSERT:
      return db
        .from(query.table)
        .upsert(ownedPayload(query, payload), {
          onConflict: query.onConflict.length > 0 ? query.onConflict.join(",") : undefined,
        })
        .select(selection(query));
    case Operation.DELETE:
      return db.from(query.table).delete().select(selection(query));
    default:
      return db.from(query.table).select(selection(query), {
        count: query.countExact ? "exact" : undefined,
      });
  }
}

function shaped(builder: any, query: Query): any {
  let current = builder;

  for (const order of query.order) {
    current = current.order(order.column, {
      ascending: !order.descending,
      nullsFirst: order.nullsFirst,
    });
  }

  const range = query.range;
  if (range && range.limit > 0) {
    current = current.range(range.offset, range.offset + range.limit - 1);
  } else if (range && range.offset > 0) {
    current = current.range(range.offset, range.offset + 999);
  }

  return query.single ? current.maybeSingle() : current;
}

async function runRpc(query: Query): Promise<QueryResult> {
  const db = PostgrestClients.service() as any;
  const { data, error } = await db.rpc(query.rpcName, decodeJson(query.rpcArgs) ?? {});

  return create(QueryResultSchema, {
    data: encodeJson(data ?? null),
    error: error ? { code: error.code ?? "rpc_failed", message: error.message } : undefined,
  });
}

export async function executeQuery(query: Query): Promise<QueryResult> {
  if (query.operation === Operation.RPC) return runRpc(query);

  const db = PostgrestClients.service() as any;

  let builder = started(query, db);
  builder = applyFilters(builder, query.where);

  const owner = ownerFilter(query);
  if (owner) builder = applyOperator(builder, owner);

  const { data, error, count } = await shaped(builder, query);

  return create(QueryResultSchema, {
    data: encodeJson(data ?? null),
    count: BigInt(count ?? 0),
    error: error ? { code: error.code ?? "query_failed", message: error.message } : undefined,
  });
}
