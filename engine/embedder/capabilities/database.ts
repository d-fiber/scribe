// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

// deno-lint-ignore-file no-explicit-any

import type { Future } from "@scribe/alchemy";
import { create } from "@bufbuild/protobuf";
import {
  type Filter,
  type FilterGroup,
  FilterOperator,
  FilterSchema,
  Operation,
  type Query,
  type QueryBatch,
  type QueryResult,
  type QueryResultBatch,
  QueryResultBatchSchema,
  QueryResultSchema,
} from "@scribe/sdk/gen/scribe/packages/foundation/protocol/database_pb.ts";
import {
  AMBIGUITY_PROBE,
  assertPlainColumn,
  keywordLiteral,
  NOBODY,
  ownerOf,
  ownerScope,
  PostgrestClients,
  quoteFilterList,
  quoteFilterLiteral,
  UnsafeFilterError,
} from "@scribe/foundation/database";
import { decodeJson, encodeJson } from "../control/json.ts";

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

const OPERATOR_NAMES: Partial<Record<FilterOperator, string>> = {
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
  [FilterOperator.CONTAINS]: "cs",
  [FilterOperator.CONTAINED_BY]: "cd",
  [FilterOperator.OVERLAPS]: "ov",
  [FilterOperator.TEXT_SEARCH]: "fts",
};

function operatorName(operator: FilterOperator): string {
  const name = OPERATOR_NAMES[operator];
  if (name === undefined) {
    throw new UnsafeFilterError(`operator ${operator} has no disjunction form`);
  }
  return name;
}

function disjunctionTerm(filter: Filter): string {
  const column = assertPlainColumn(filter.column);
  const operator = operatorName(filter.operator);
  const value = decodeJson(filter.value);
  const negation = filter.negated ? "not." : "";

  if (filter.operator === FilterOperator.IS) {
    return `${column}.${negation}is.${keywordLiteral(value)}`;
  }

  if (filter.operator === FilterOperator.IN) {
    const values = Array.isArray(value) ? value : [value];
    return `${column}.${negation}in.${quoteFilterList(values)}`;
  }

  return `${column}.${negation}${operator}.${quoteFilterLiteral(value)}`;
}

function disjunction(group: FilterGroup): string {
  return group.filters.map(disjunctionTerm).join(",");
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

/** Whether `where` names anything at all, at any depth. */
function namesSomething(where: FilterGroup | undefined): boolean {
  if (!where) return false;
  if (where.filters.length > 0) return true;
  return where.groups.some(namesSomething);
}

/**
 * Whether `query` is a write that would reach every row of its table.
 *
 * @remarks
 * A worker sends what it means, and an update or a delete carrying no predicate means the whole
 * table. That is almost always a filter somebody forgot to build rather than a table somebody
 * meant to empty, so it is refused here: the two are indistinguishable once the statement has
 * run, and only one of them is recoverable.
 *
 * An owned table is already bounded by the owner filter, so the question only arises where no
 * column says who a row belongs to.
 */
function reachesEveryRow(query: Query): boolean {
  if (query.operation !== Operation.UPDATE && query.operation !== Operation.DELETE) return false;
  if (namesSomething(query.where)) return false;

  return ownerFilter(query) === null;
}

function ownerFilter(query: Query): Filter | null {
  const column = ownerOf(query.table);
  if (column === null) return null;

  const decision = ownerScope(query.table);
  if (decision.kind === "open") return null;

  return create(FilterSchema, {
    column: decision.column,
    operator: FilterOperator.EQ,
    value: encodeJson(decision.kind === "scoped" ? decision.id : NOBODY),
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
  } else if (query.single) {
    current = current.limit(AMBIGUITY_PROBE);
  }

  return query.single ? current.maybeSingle() : current;
}

async function runRpc(query: Query): Future<QueryResult> {
  const db = PostgrestClients.service() as any;
  const { data, error } = await db.rpc(query.rpcName, decodeJson(query.rpcArgs) ?? {});

  return create(QueryResultSchema, {
    data: encodeJson(data ?? null),
    error: error ? { code: error.code ?? "rpc_failed", message: error.message } : undefined,
  });
}

/**
 * The result of `query`, run against PostgREST under the service role.
 *
 * @throws {Error} When the caller owns a different row than the one `query` reaches. Owner scoping
 * is decided here, in TypeScript, and never by a row level security policy.
 */
export async function executeQuery(query: Query): Future<QueryResult> {
  if (query.operation === Operation.RPC) return runRpc(query);

  if (reachesEveryRow(query)) {
    return create(QueryResultSchema, {
      error: {
        code: "unbounded_write",
        message: `refusing to ${Operation[query.operation].toLowerCase()} every row of "${query.table}": ` +
          "the query names no row, and no column says who a row belongs to.",
      },
    });
  }

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

function refused(cause: unknown): QueryResult {
  return create(QueryResultSchema, {
    error: {
      code: "query_refused",
      message: cause instanceof Error ? cause.message : String(cause),
    },
  });
}

/**
 * The results of every query in `batch`, in the order the batch listed them.
 *
 * @remarks
 * The queries run concurrently, so a batch is for queries that do not read what another one in the
 * same batch writes. What it buys is the round trip: a worker that reads three times pays one hop
 * to the host instead of three, and the hop is what a request on this path spends most of its time
 * in.
 *
 * A query the owner check refuses answers a `query_refused` entry rather than sinking the batch,
 * because the caller asked for several answers and the ones it may have are still worth returning.
 */
export async function executeQueries(batch: QueryBatch): Future<QueryResultBatch> {
  const results = await Promise.all(
    batch.queries.map((query) => executeQuery(query).catch(refused)),
  );

  return create(QueryResultBatchSchema, { results });
}
