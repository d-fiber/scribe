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

import { create } from "@bufbuild/protobuf";
import {
  type Filter,
  FilterOperator,
  FilterSchema,
} from "../../../gen/scribe/packages/foundation/protocol/database_pb.ts";
import { encodeJson } from "../../contracts/json.ts";

/**
 * Builds one `Filter` message, the wire shape a query condition takes to cross from the worker
 * isolate to the host, which is where it is actually run against PostgREST.
 */
function on(column: string, operator: FilterOperator, value: unknown, negated = false): Filter {
  return create(FilterSchema, {
    column,
    operator,
    value: encodeJson(value),
    negated,
  });
}

/** The comparisons a query can filter a column of type `V` by. */
export interface FilterOps<V> {
  /** The column equals `value`. */
  eq(value: V): Filter;

  /** The column does not equal `value`. */
  neq(value: V): Filter;

  /** The column is greater than `value`. */
  gt(value: V): Filter;

  /** The column is greater than or equal to `value`. */
  gte(value: V): Filter;

  /** The column is less than `value`. */
  lt(value: V): Filter;

  /** The column is less than or equal to `value`. */
  lte(value: V): Filter;

  /** The column is `value`, the null-safe comparison PostgREST needs for a null check. */
  is(value: V | null): Filter;

  /** The column is one of `values`. */
  in(values: readonly V[]): Filter;

  /** The column matches `pattern`, a SQL `LIKE` pattern, case-sensitively. */
  like(pattern: string): Filter;

  /** The same as {@link like}, case-insensitively. */
  ilike(pattern: string): Filter;

  /**
   * The column, read as an array or a JSON document, contains `value`.
   *
   * `value` is left as `unknown` rather than `V` because what it takes to be contained is a
   * shape of its own, an array element or a partial object, not the column's own value type.
   */
  contains(value: unknown): Filter;

  /** The reverse of {@link contains}: the column is contained by `value`. */
  containedBy(value: unknown): Filter;

  /** The column, read as a range or an array, overlaps `value`. */
  overlaps(value: unknown): Filter;

  /** The column matches `query` under PostgreSQL full text search. */
  textSearch(query: string): Filter;
}

/** One `FilterOps<Row[K]>` per column of `Row`, for a worker to build a condition typed by the column it names. */
export type FilterBuilder<Row> = {
  readonly [K in keyof Row & string]: FilterOps<Row[K]>;
};

/**
 * A {@link FilterBuilder} for `Row`, built without ever listing `Row`'s columns at runtime.
 *
 * @remarks
 * `FilterBuilder`'s mapped type only exists for the type checker: nothing in a worker script
 * carries `Row`'s keys at runtime, since `Row` is erased once compiled. A `Proxy` answers every
 * property access with the same set of operators regardless of which column was named, so
 * `row.anyColumn.eq(...)` resolves at runtime while the type declares only the columns `Row`
 * actually has, and a typo is still caught by the type checker before this ever runs.
 */
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
