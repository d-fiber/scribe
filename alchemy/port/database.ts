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

import type { Future } from "../async/future.ts";
import { Slot } from "../bind/slot.ts";
import type { List } from "../value/list.ts";
import type { Result } from "../value/result.ts";

/** One table of a schema, as the package that owns the SQL declares it. */
export interface TableShape {
  /** The shape of one row of this table. */
  readonly row: object;
}

/**
 * A whole schema, from table name to shape.
 *
 * @remarks
 * Nothing here ever holds one. It is a type parameter, filled by whoever owns the SQL, which is
 * what keeps this free of any knowledge of a particular database.
 */
export type DatabaseSchema = Record<string, TableShape>;

/** One condition of a `where`, opaque to whoever built it. */
export interface FilterSpec {
  /** The column this condition narrows. */
  readonly column: string;
}

/** The comparisons a condition can be built from, on one column. */
export interface ColumnFilter<V> {
  /** Rows whose column equals `value`. */
  eq(value: V): FilterSpec;

  /** Rows whose column is one of `values`. */
  in(values: List<V>): FilterSpec;

  /** Rows whose column is `value`, null included, compared by identity rather than by equality. */
  is(value: V | null): FilterSpec;

  /** Rows whose column is strictly greater than `value`. */
  gt(value: V): FilterSpec;

  /** Rows whose column is strictly less than `value`. */
  lt(value: V): FilterSpec;

  /** Rows whose column is greater than `value` or equal to it. */
  gte(value: V): FilterSpec;

  /** Rows whose column is less than `value` or equal to it. */
  lte(value: V): FilterSpec;

  /** Rows whose column matches `pattern`, where `%` stands for any run and `_` for one character. */
  like(pattern: string): FilterSpec;

  /** Like {@link like}, ignoring case. */
  ilike(pattern: string): FilterSpec;

  /** Rows whose column differs from `value`. */
  neq(value: V): FilterSpec;
}

/** What a `where` is handed: one filter per column of the row. */
export type Filters<Row> = {
  readonly [K in keyof Row & string]: ColumnFilter<Row[K]>;
};

/** What a projection is handed: each column of the row answers its own name. */
export type Columns<Row> = { readonly [K in keyof Row & string]: K };

/** What a projection yields, one field per name the projector gave. */
export type Projected<Row, Shape extends Record<string, unknown>> = {
  [K in keyof Shape]: Shape[K] extends keyof Row ? Row[Shape[K]] : never;
};

/** Which way an order runs. */
export interface OrderOptions {
  /** Whether to order upwards. Downwards when false. Upwards when left out. */
  readonly ascending?: boolean;
}

/**
 * A query being built on one table.
 *
 * @remarks
 * Every method answers a new query rather than changing this one, so a query held in a constant
 * can be narrowed twice without the second narrowing seeing the first.
 *
 * Reading and writing refuse differently, and the difference is deliberate. A read that the backend
 * refused raises, because a caller asking for rows has no useful answer to give back. A write
 * answers an outcome, because a caller that could not write has to know **why** before it decides
 * whether to try again: a write refused by a constraint must never be replayed, and a write whose
 * acknowledgement was lost usually must. A boolean folded those two together, and every caller that
 * retried on false was retrying half of them wrongly.
 */
export interface Query<Row extends object, Answer = Row> {
  /** Narrows what comes back to the columns `project` names, under the names it gives them. */
  select<const Shape extends Record<string, keyof Row & string>>(
    project: (columns: Columns<Row>) => Shape,
  ): Query<Row, Projected<Row, Shape>>;

  /** Adds what `build` returns, kept in the order it was added. */
  where(
    build: (filters: Filters<Row>) => FilterSpec | List<FilterSpec>,
  ): Query<Row, Answer>;

  /** Orders by `column`. */
  order<K extends keyof Row & string>(
    column: K,
    options?: OrderOptions,
  ): Query<Row, Answer>;

  /** Asks for at most `count` rows. */
  limit(count: number): Query<Row, Answer>;

  /** Asks for the rows from `from` to `to`, both included. */
  range(from: number, to: number): Query<Row, Answer>;

  /**
   * The rows this query matches.
   *
   * @throws {Refusal} `denied` when the backend refused the query, `unavailable` when it could not
   * be reached. The two are told apart because only the second is worth trying again.
   */
  get(): Future<List<Answer>>;

  /**
   * The one row this query matches, or null when it matches none.
   *
   * @throws {Refusal} `denied` when the backend refused the query, `unavailable` when it could not
   * be reached.
   */
  getOne(): Future<Answer | null>;

  /** Writes one row or a batch, and answers how it went. */
  insert(data: Partial<Row> | List<Partial<Row>>): Future<Result<number>>;

  /** Writes one row and answers it back. */
  insertOne(data: Partial<Row>): Future<Result<Row>>;

  /** Writes `data` over every matched row, and answers how many it touched. */
  update(data: Partial<Row>): Future<Result<number>>;

  /** Removes every matched row, and answers how many it removed. */
  delete(): Future<Result<number>>;

  /** Removes one matched row and answers it back. */
  deleteOne(): Future<Result<Row>>;
}

/** What answers a query on a named table. */
export interface DatabaseDriver {
  /** A query on `name`, typed by the schema the package declares. */
  table<S extends DatabaseSchema, K extends keyof S & string>(
    name: K,
  ): Query<S[K]["row"] & object>;
}

/**
 * What answers a package that reaches the database.
 *
 * @remarks
 * The host fills this once, at boot. A package declares its own schema, asks for a table by name,
 * and never names a driver.
 */
export const Databases: Slot<DatabaseDriver> = new Slot<DatabaseDriver>(
  "Databases",
);

/**
 * Every table `S` describes, each answering a query typed by the row it holds.
 *
 * @remarks
 * It exists so the schema can be named once, at the top of a package, rather than at every call. A
 * free type parameter cannot be inferred from a table name, so a function taking both had to be
 * written `table<Schema, "users">("users")`, with the name given twice, and written `table("users")`
 * it silently answered a query typed as nothing in particular.
 */
export interface Tables<S extends DatabaseSchema> {
  /** A query on `name`, typed by the row `S` says that table holds. */
  table<K extends keyof S & string>(name: K): Query<S[K]["row"] & object>;
}

/**
 * The tables of `S`, ready to be queried, without reaching the database.
 *
 * @remarks
 * A package names its schema once and holds this at module scope, which runs at import, before the
 * host has filled {@link Databases}. Nothing is reached until a row is asked for.
 *
 * @example
 * ```ts
 * const db = schema<AudienceSchema>();
 *
 * const held = await db.table("memberships").where((f) => f.account.is(accountId)).get();
 * ```
 */
export function schema<S extends DatabaseSchema>(): Tables<S> {
  return {
    table<K extends keyof S & string>(name: K): Query<S[K]["row"] & object> {
      return deferred<S[K]["row"] & object, S[K]["row"] & object>(() => Databases.get().table<S, K>(name));
    },
  };
}

function deferred<Row extends object, Answer>(
  open: () => Query<Row, Answer>,
): Query<Row, Answer> {
  const narrowed = <T>(build: (query: Query<Row, Answer>) => T) => build(open());

  return {
    select: (project) => deferred(() => open().select(project)),
    where: (build) => deferred(() => open().where(build)),
    order: (column, options) => deferred(() => open().order(column, options)),
    limit: (count) => deferred(() => open().limit(count)),
    range: (from, to) => deferred(() => open().range(from, to)),
    get: () => narrowed((query) => query.get()),
    getOne: () => narrowed((query) => query.getOne()),
    insert: (data) => narrowed((query) => query.insert(data)),
    insertOne: (data) => narrowed((query) => query.insertOne(data)),
    update: (data) => narrowed((query) => query.update(data)),
    delete: () => narrowed((query) => query.delete()),
    deleteOne: () => narrowed((query) => query.deleteOne()),
  };
}
