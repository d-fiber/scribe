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
} from "../../../gen/scribe/host/pkg/packages/foundation/protocol/database/database_pb.ts";
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
