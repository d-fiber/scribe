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

import { Slot } from "../bind/slot.ts";

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
  in(values: V[]): FilterSpec;

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
export type Filters<Row> = { readonly [K in keyof Row & string]: ColumnFilter<Row[K]> };

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
 * Reading and writing refuse differently, and the difference is deliberate. A read that the
 * backend refused throws, because a caller asking for rows has no useful answer to give back. A
 * write answers false, because a caller that could not write usually has something else to do
 * about it.
 */
export interface Query<Row extends object, Result = Row> {
  /**
   * Drops the owner scope, for a query whose authorisation was decided upstream.
   *
   * @remarks
   * The scope narrows a query to the rows the caller owns. Dropping it is how a package reads
   * across owners on purpose, and it is a decision worth seeing at the call site.
   */
  unscoped(): Query<Row, Result>;

  /** Narrows what comes back to the columns `project` names, under the names it gives them. */
  select<const Shape extends Record<string, keyof Row & string>>(
    project: (columns: Columns<Row>) => Shape,
  ): Query<Row, Projected<Row, Shape>>;

  /**
   * Narrows what comes back to `columns`, written as the backend reads them.
   *
   * @remarks
   * This is the one place the wire shows through: `columns` is a selection string the backend
   * parses, not something typed here. It exists for a projection that was compiled elsewhere, and
   * a package that can write {@link select} should.
   */
  selectRaw<R extends object = Row>(columns: string): Query<Row, R>;

  /** Adds what `build` returns, kept in the order it was added. */
  where(build: (filters: Filters<Row>) => FilterSpec | FilterSpec[]): Query<Row, Result>;

  /** Orders by `column`. */
  order<K extends keyof Row & string>(column: K, options?: OrderOptions): Query<Row, Result>;

  /** Asks for at most `count` rows. */
  limit(count: number): Query<Row, Result>;

  /** Asks for the rows from `from` to `to`, both included. */
  range(from: number, to: number): Query<Row, Result>;

  /**
   * The rows this query matches.
   *
   * @throws {DatabaseError} When the backend refused the query or could not be reached.
   */
  get(): Promise<Result[]>;

  /**
   * The one row this query matches, or null when it matches none.
   *
   * @throws {DatabaseError} When the backend refused the query or could not be reached.
   */
  getOne(): Promise<Result | null>;

  /** Writes one row or a batch, and answers whether it went through. */
  insert(data: Partial<Row> | Partial<Row>[]): Promise<boolean>;

  /** Writes one row and answers it back, or null when the write was refused. */
  insertOne(data: Partial<Row>): Promise<Row | null>;

  /** Writes `data` over every matched row, and answers whether it went through. */
  update(data: Partial<Row>): Promise<boolean>;

  /** Removes every matched row, and answers whether it went through. */
  delete(): Promise<boolean>;

  /** Removes one matched row and answers it back, or null when none was removed. */
  deleteOne(): Promise<Row | null>;
}

/** What answers a query on a named table. */
export interface DatabaseDriver {
  /** A query on `name`, typed by the schema the package declares. */
  table<S extends DatabaseSchema, K extends keyof S & string>(name: K): Query<S[K]["row"] & object>;
}

/**
 * What answers a package that reaches the database.
 *
 * @remarks
 * The host fills this once, at boot. A package declares its own schema, asks for a table by name,
 * and never names a driver.
 */
export const Databases: Slot<DatabaseDriver> = new Slot<DatabaseDriver>("Databases");

/**
 * A query on `name`, opened at the first call and not at the declaration.
 *
 * @remarks
 * A table is usually held in a constant at module scope, which runs at import, before the host has
 * filled {@link Databases}. Nothing is reached until a row is asked for.
 */
export function table<S extends DatabaseSchema, K extends keyof S & string>(
  name: K,
): Query<S[K]["row"] & object> {
  return deferred(() => Databases.get().table<S, K>(name));
}

function deferred<Row extends object, Result>(open: () => Query<Row, Result>): Query<Row, Result> {
  const narrowed = <T>(build: (query: Query<Row, Result>) => T) => build(open());

  return {
    unscoped: () => deferred(() => open().unscoped()),
    select: (project) => deferred(() => open().select(project)),
    selectRaw: (columns) => deferred(() => open().selectRaw(columns)),
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
  } as Query<Row, Result>;
}
