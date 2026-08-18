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

import { create } from "@bufbuild/protobuf";
import {
  type Filter,
  FilterOperator,
  FilterSchema,
} from "../../../gen/scribe/host/packages/foundation/database/rest/protocol/rest_pb.ts";
import { encodeJson } from "../../contracts/json.ts";

function on(column: string, operator: FilterOperator, value: unknown, negated = false): Filter {
  return create(FilterSchema, {
    column,
    operator,
    value: encodeJson(value),
    negated,
  });
}

export interface FilterOps<V> {
  eq(value: V): Filter;
  neq(value: V): Filter;
  gt(value: V): Filter;
  gte(value: V): Filter;
  lt(value: V): Filter;
  lte(value: V): Filter;
  is(value: V | null): Filter;
  in(values: readonly V[]): Filter;
  like(pattern: string): Filter;
  ilike(pattern: string): Filter;
  contains(value: unknown): Filter;
  containedBy(value: unknown): Filter;
  overlaps(value: unknown): Filter;
  textSearch(query: string): Filter;
}

export type FilterBuilder<Row> = {
  readonly [K in keyof Row & string]: FilterOps<Row[K]>;
};

export function filters<Row>(): FilterBuilder<Row> {
  const ops = (column: string): FilterOps<unknown> => ({
    eq: (value) => on(column, FilterOperator.EQ, value),
    neq: (value) => on(column, FilterOperator.NEQ, value),
    gt: (value) => on(column, FilterOperator.GT, value),
    gte: (value) => on(column, FilterOperator.GTE, value),
    lt: (value) => on(column, FilterOperator.LT, value),
    lte: (value) => on(column, FilterOperator.LTE, value),
    is: (value) => on(column, FilterOperator.IS, value),
    in: (values) => on(column, FilterOperator.IN, values),
    like: (pattern) => on(column, FilterOperator.LIKE, pattern),
    ilike: (pattern) => on(column, FilterOperator.ILIKE, pattern),
    contains: (value) => on(column, FilterOperator.CONTAINS, value),
    containedBy: (value) => on(column, FilterOperator.CONTAINED_BY, value),
    overlaps: (value) => on(column, FilterOperator.OVERLAPS, value),
    textSearch: (query) => on(column, FilterOperator.TEXT_SEARCH, query),
  });

  return new Proxy({} as FilterBuilder<Row>, {
    get: (_, column: string) => ops(column),
  });
}
