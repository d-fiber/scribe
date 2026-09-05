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

import { Registry } from "../../../declare/registry.ts";
import type { UnmodifiableList } from "../../../value/list.ts";
import type { Loose } from "../../value.ts";
import type { DbMoment, GrantOptions, GrantRole, Privilege } from "../access/grant.ts";
import { declareGrant } from "../access/grant.ts";
import type {
  ColumnDefinition,
  ColumnMap,
  DeferrableOptions,
  ReferentialAction,
  ReferentialMatch,
} from "../types/column.ts";
import { ColumnFactory, columnsOf } from "../types/column.ts";

/**
 * The access method a Postgres index is built with, spelled the way `create index` takes it —
 * kept for autocompletion, not as a hard boundary; see `SocleNetwork` in `service.ts` for why.
 *
 * @remarks
 * Postgres itself ships six, and an extension can add its own — `pgvector`'s `ivfflat` and `hnsw`
 * chief among them — so this stays open the same way `RoleAttribute` does, rather than refusing a
 * value this package does not own.
 */
export type IndexAccessMethod = Loose<
  "btree" | "gin" | "gist" | "hash" | "brin" | "spgist"
>;

/**
 * One column an index covers, spelled out rather than left as a bare name, for the entry that
 * needs a collation, an operator class, or its own sort order.
 */
export interface IndexColumn {
  /**
   * The raw Postgres expression this entry covers, most often a bare column name.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a function's `body`
   * make for raw Postgres text no closed vocabulary covers — an expression a bare column name
   * cannot express, `"lower(email)"`, belongs here just as well as a plain column would.
   */
  readonly expression: string;

  /** The collation this entry sorts and compares under, by name. Postgres's own default for its type when left out. */
  readonly collation?: string;

  /** The operator class this entry is indexed with, by name. Postgres's own default for its type when left out. */
  readonly opclass?: string;

  /** The order this entry sorts in. Ascending when left out, Postgres's own default. Meaningless on an access method other than `btree`. */
  readonly order?: "asc" | "desc";

  /** Where a null sorts relative to every other value. Postgres's own default for {@link order} when left out. */
  readonly nulls?: "first" | "last";
}

/** An index exactly as a {@link TableIndexBuilder} resolved it, `table` filled in from the name it was declared under. */
export interface IndexOptions {
  /** The table this index covers. */
  readonly table: string;

  /**
   * The columns this index covers, in the order Postgres will list them, at least one.
   *
   * @remarks
   * A bare string is read as an {@link IndexColumn.expression} with every other field left out;
   * reach for the object form only when an entry needs a collation, an operator class, or its own
   * sort order.
   */
  readonly columns: UnmodifiableList<string | IndexColumn>;

  /** Whether this index refuses a row whose covered columns match one already stored. */
  readonly unique?: boolean;

  /** Whether a `unique` index treats several nulls as a conflict, rather than as distinct from one another. Silently unused when {@link unique} is not set. */
  readonly nullsNotDistinct?: boolean;

  /** The access method this index is built with. `btree` when left out, Postgres's own default. */
  readonly using?: IndexAccessMethod;

  /** Extra columns this index carries for an index-only scan, without being part of the key itself. */
  readonly include?: UnmodifiableList<string>;

  /** The fraction of each page Postgres leaves free for this index's own future growth, 10 to 100. Postgres's own default, 90, when left out. */
  readonly fillfactor?: number;

  /**
   * Restricts this index to the rows where this raw Postgres predicate holds, making it a partial
   * index. Covers every row when left out.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a function's `body`
   * make for raw Postgres text no closed vocabulary covers.
   */
  readonly where?: string;
}

/** An index exactly as `Table` declared it. */
export interface DeclaredIndex {
  /** The name this index is created under. */
  readonly name: string;

  /** What it covers, and the constraints it carries. */
  readonly options: IndexOptions;
}

/**
 * One entry of `Table`'s own `.indexes`: an index, resolved where the table it covers already is,
 * with no `table` field to repeat — the table it is declared under already says which one.
 */
export interface TableIndex extends Omit<IndexOptions, "table"> {
  /** The name this index is created under. */
  readonly name: string;
}

/** The statement a row-level security policy applies to. `all` when left out, Postgres's own default. */
export type PolicyCommand = "all" | "select" | "insert" | "update" | "delete";

/**
 * Whether a policy narrows what a role may see and write (`permissive`, the default: several
 * permissive policies on the same table are combined with `or`), or additionally restricts it on
 * top of every permissive policy (`restrictive`: combined with `and`, and inert on its own — a
 * table with only restrictive policies grants nothing at all).
 */
export type PolicyKind = "permissive" | "restrictive";

/**
 * A role a policy names, spelled the way `create policy` takes it — kept for autocompletion, not
 * as a hard boundary; see `SocleNetwork` in `service.ts` for why. A cluster's own role names are
 * not a vocabulary this package owns.
 */
export type PolicyRole = Loose<
  "public" | "current_role" | "current_user" | "session_user"
>;

/** A policy exactly as a {@link TablePolicyBuilder} resolved it, `table` filled in from the name it was declared under. */
export interface PolicyOptions {
  /** The table this policy guards. */
  readonly table: string;

  /** The statement this policy applies to. `all` when left out. */
  readonly for?: PolicyCommand;

  /** Whether this policy narrows or additionally restricts. `permissive` when left out. */
  readonly as?: PolicyKind;

  /** The roles this policy applies to. Every role when left out, Postgres's own default. */
  readonly to?: UnmodifiableList<PolicyRole>;

  /**
   * The raw predicate a row must satisfy to be visible to `select`, or touchable by `update`/`delete`.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a check constraint's
   * `expression` make for raw Postgres text no closed vocabulary covers. For `all` or `update` with
   * no {@link withCheck} of its own, Postgres reuses this same predicate to check the row being
   * written, not only the row being read.
   */
  readonly using?: string;

  /**
   * The raw predicate a row written by `insert`, or the new value of a row touched by `update`,
   * must satisfy.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a check constraint's
   * `expression` make for raw Postgres text no closed vocabulary covers.
   */
  readonly withCheck?: string;
}

/** A policy exactly as `Table` declared it. */
export interface DeclaredPolicy {
  /** The name this policy is created under. */
  readonly name: string;

  /** The table it guards, who it applies to, and the rows it lets through. */
  readonly options: PolicyOptions;
}

/**
 * One entry of `Table`'s own `.policies`: a row-level security policy, resolved where the table it
 * guards already is, with no `table` field to repeat — the table it is declared under already says
 * which one.
 */
export interface TablePolicy extends Omit<PolicyOptions, "table"> {
  /** The name this policy is created under. */
  readonly name: string;
}

/**
 * One entry of `Table`'s own `.grants`: a privilege grant on the table it sits on, with no
 * {@link GrantOptions.on} to spell out — the table it is declared under already says which one, and
 * always as `kind: "table"`, the only kind a grant nested here could ever mean.
 */
export type TableGrant = Omit<GrantOptions, "on">;

/** A `check` constraint, carried by the table rather than by one column, so it may read several at once. */
export interface CheckConstraint {
  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  readonly name?: string;

  /**
   * The raw Postgres predicate every row must satisfy.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a function's `body`
   * make for raw Postgres text no closed vocabulary covers.
   */
  readonly expression: string;

  /** Whether a table that inherits this one also inherits the constraint. Inherited when left out. */
  readonly noInherit?: boolean;
}

/** A `unique` constraint spanning one or several columns at once. */
export interface UniqueConstraint extends DeferrableOptions {
  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  readonly name?: string;

  /** The columns that, together, must not repeat across two rows. */
  readonly columns: UnmodifiableList<string>;

  /** Whether several rows may each carry a null in every one of {@link columns} at once. */
  readonly nullsNotDistinct?: boolean;

  /** Extra columns the backing index carries for an index-only scan, without being part of the key itself. */
  readonly include?: UnmodifiableList<string>;
}

/** A composite `primary key`, spanning every column named. */
export interface PrimaryKeyConstraint extends DeferrableOptions {
  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  readonly name?: string;

  /** The columns that, together, identify a row. Every one of them is refused a null value. */
  readonly columns: UnmodifiableList<string>;

  /** Extra columns the backing index carries for an index-only scan, without being part of the key itself. */
  readonly include?: UnmodifiableList<string>;
}

/** A `foreign key` constraint spanning one or several columns at once. */
export interface TableForeignKey extends DeferrableOptions {
  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  readonly name?: string;

  /** The columns of this table that, together, form the key. */
  readonly columns: UnmodifiableList<string>;

  /** The table {@link columns} points at. */
  readonly referencedTable: string;

  /** The columns of {@link referencedTable} this key points at, in the same order as {@link columns}. Its primary key when left out. */
  readonly referencedColumns?: UnmodifiableList<string>;

  /** What happens to this row when the referenced row is deleted. Nothing special when left out. */
  readonly onDelete?: ReferentialAction;

  /** What happens to this row when the referenced row's key changes. Nothing special when left out. */
  readonly onUpdate?: ReferentialAction;

  /** Whether every column of this key must be null together, or may be null independently. `simple` when left out. */
  readonly match?: ReferentialMatch;
}

/** One term of an `exclude` constraint: a value the constraint reads, and the operator it compares two rows' values with. */
export interface ExcludeElement {
  /**
   * The raw Postgres expression this term reads from a row, most often a bare column name.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a function's `body`
   * make for raw Postgres text no closed vocabulary covers.
   */
  readonly expression: string;

  /**
   * The operator two rows' values are compared with, raw, `"&&"` for overlap or `"="` for equality
   * chief among them. Must be commutative: Postgres reads it both ways around.
   */
  readonly operator: string;
}

/**
 * An `exclude` constraint: refuses two rows where every {@link ExcludeConstraint.elements} term
 * compares true against the operator it carries — most often used to forbid two rows whose ranges
 * overlap, which neither `unique` nor `check` can express on their own.
 */
export interface ExcludeConstraint extends DeferrableOptions {
  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  readonly name?: string;

  /** The index access method the constraint is backed by. `gist` covers the ordinary range-overlap case; `btree` cannot back an `exclude` constraint at all. */
  readonly using?: IndexAccessMethod;

  /** The terms compared between two rows, at least one. */
  readonly elements: UnmodifiableList<ExcludeElement>;

  /** Restricts the constraint to the rows where this raw Postgres predicate holds, making it a partial exclusion. Covers every row when left out. */
  readonly where?: string;
}

/** A table exactly as `Table` declared it. */
export interface DeclaredTable {
  /** The name this table is created under. */
  readonly name: string;

  /** This table's columns, by field name, in the order `.columns` gave them. */
  readonly columns: Readonly<Record<string, ColumnDefinition>>;

  /** This table's composite primary key. Null when it carries none, or carries a single-column one on a column instead. */
  readonly primaryKey: PrimaryKeyConstraint | null;

  /** This table's multi-column or otherwise adorned `unique` constraints. */
  readonly uniques: UnmodifiableList<UniqueConstraint>;

  /** This table's `check` constraints. */
  readonly checks: UnmodifiableList<CheckConstraint>;

  /** This table's table-level `foreign key` constraints. */
  readonly foreignKeys: UnmodifiableList<TableForeignKey>;

  /** This table's `exclude` constraints. */
  readonly excludes: UnmodifiableList<ExcludeConstraint>;

  /** The fillfactor this table was created with. Null when Postgres's own default, 100, applies. */
  readonly fillfactor: number | null;

  /** Whether this table skips the write-ahead log. */
  readonly unlogged: boolean;
}

/** A table, and the moment it belongs to — not part of {@link DeclaredTable} itself, since which moment a table belongs to is where it is filed, not a fact carried on the table. */
interface StoredTable {
  /** The moment this table belongs to. */
  readonly moment: DbMoment;

  /** The table exactly as `Table` declared it. */
  readonly table: DeclaredTable;
}

/** An index, and the moment its table belongs to. */
interface StoredIndex {
  /** The moment this index's table belongs to. */
  readonly moment: DbMoment;

  /** The index exactly as `Table` declared it. */
  readonly index: DeclaredIndex;
}

/** A policy, and the moment its table belongs to. */
interface StoredPolicy {
  /** The moment this policy's table belongs to. */
  readonly moment: DbMoment;

  /** The policy exactly as `Table` declared it. */
  readonly policy: DeclaredPolicy;
}

/** Every table this package has declared, by the name it took, alongside the moment it was declared for. */
const declaredTable = new Registry<StoredTable>("table");

/** Every index this package has declared, by the name it took, regardless of which table's `Table` carried it. */
const declaredIndex = new Registry<StoredIndex>("index");

/** Every policy this package has declared, by the name it took, regardless of which table's `Table` carried it. */
const declaredPolicy = new Registry<StoredPolicy>("policy");

/** Opens a table's composite primary key, closed by {@link TablePrimaryKeyBuilder.columns}. */
export class TablePrimaryKeyFactory {
  /** The columns that, together, identify a row. Every one of them is refused a null value. */
  columns(columns: UnmodifiableList<string>): TablePrimaryKeyBuilder {
    return new TablePrimaryKeyBuilder(columns);
  }
}

/** A table's composite primary key under construction, opened by {@link TablePrimaryKeyFactory.columns}. */
export class TablePrimaryKeyBuilder {
  readonly #columns: UnmodifiableList<string>;
  #name?: string;
  #include?: UnmodifiableList<string>;
  #deferrable?: boolean;
  #initiallyDeferred?: boolean;

  /** Opened by {@link TablePrimaryKeyFactory.columns}, never directly. */
  constructor(columns: UnmodifiableList<string>) {
    this.#columns = columns;
  }

  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  name(name: string): this {
    this.#name = name;
    return this;
  }

  /** Extra columns the backing index carries for an index-only scan, without being part of the key itself. */
  include(columns: UnmodifiableList<string>): this {
    this.#include = columns;
    return this;
  }

  /** Lets this constraint wait until the end of its transaction to be checked, rather than immediately. */
  deferrable(initiallyDeferred = false): this {
    this.#deferrable = true;
    this.#initiallyDeferred = initiallyDeferred;
    return this;
  }

  /** This constraint, exactly as `Table` reads it once its own `.primaryKey` callback returns. */
  build(): PrimaryKeyConstraint {
    return {
      columns: this.#columns,
      name: this.#name,
      include: this.#include,
      deferrable: this.#deferrable,
      initiallyDeferred: this.#initiallyDeferred,
    };
  }
}

/** Opens a `unique` constraint, closed by {@link TableUniqueBuilder.build} once `Table` reads it back. */
export class TableUniqueFactory {
  /** The columns that, together, must not repeat across two rows. */
  columns(columns: UnmodifiableList<string>): TableUniqueBuilder {
    return new TableUniqueBuilder(columns);
  }
}

/** A `unique` constraint under construction, opened by {@link TableUniqueFactory.columns}. */
export class TableUniqueBuilder {
  readonly #columns: UnmodifiableList<string>;
  #name?: string;
  #nullsNotDistinct?: boolean;
  #include?: UnmodifiableList<string>;
  #deferrable?: boolean;
  #initiallyDeferred?: boolean;

  /** Opened by {@link TableUniqueFactory.columns}, never directly. */
  constructor(columns: UnmodifiableList<string>) {
    this.#columns = columns;
  }

  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  name(name: string): this {
    this.#name = name;
    return this;
  }

  /** Treats several rows that each carry a null in every column as a conflict, rather than as distinct from one another. */
  nullsNotDistinct(): this {
    this.#nullsNotDistinct = true;
    return this;
  }

  /** Extra columns the backing index carries for an index-only scan, without being part of the key itself. */
  include(columns: UnmodifiableList<string>): this {
    this.#include = columns;
    return this;
  }

  /** Lets this constraint wait until the end of its transaction to be checked, rather than immediately. */
  deferrable(initiallyDeferred = false): this {
    this.#deferrable = true;
    this.#initiallyDeferred = initiallyDeferred;
    return this;
  }

  /** This constraint, exactly as `Table` reads it once its own `.uniques` callback returns. */
  build(): UniqueConstraint {
    return {
      columns: this.#columns,
      name: this.#name,
      nullsNotDistinct: this.#nullsNotDistinct,
      include: this.#include,
      deferrable: this.#deferrable,
      initiallyDeferred: this.#initiallyDeferred,
    };
  }
}

/** Opens a `check` constraint, closed by {@link TableCheckBuilder.build} once `Table` reads it back. */
export class TableCheckFactory {
  /** The raw Postgres predicate every row must satisfy. Nothing here validates it, the same choice a column's `defaultValue` makes for raw Postgres text no closed vocabulary covers. */
  expression(expression: string): TableCheckBuilder {
    return new TableCheckBuilder(expression);
  }
}

/** A `check` constraint under construction, opened by {@link TableCheckFactory.expression}. */
export class TableCheckBuilder {
  readonly #expression: string;
  #name?: string;
  #noInherit?: boolean;

  /** Opened by {@link TableCheckFactory.expression}, never directly. */
  constructor(expression: string) {
    this.#expression = expression;
  }

  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  name(name: string): this {
    this.#name = name;
    return this;
  }

  /** Refuses a table that inherits this one from also inheriting the constraint. Inherited otherwise. */
  noInherit(): this {
    this.#noInherit = true;
    return this;
  }

  /** This constraint, exactly as `Table` reads it once its own `.checks` callback returns. */
  build(): CheckConstraint {
    return {
      expression: this.#expression,
      name: this.#name,
      noInherit: this.#noInherit,
    };
  }
}

/** Opens a table-level `foreign key` constraint, closed by {@link TableForeignKeyBuilder.build} once `Table` reads it back. */
export class TableForeignKeyFactory {
  /** The columns of this table that, together, form the key. */
  columns(columns: UnmodifiableList<string>): TableForeignKeyBuilder {
    return new TableForeignKeyBuilder(columns);
  }
}

/**
 * A table-level `foreign key` constraint under construction, opened by
 * {@link TableForeignKeyFactory.columns}.
 *
 * @remarks
 * `HasReference` tracks whether {@link references} was called, and is the only reason this class
 * takes a type parameter at all: `Table`'s own `.foreignKeys` only accepts
 * `TableForeignKeyBuilder<true>` in the array its callback returns, so a foreign key that never
 * named the table it points at is refused where it is written, not where `Table` later reads it.
 */
export class TableForeignKeyBuilder<HasReference extends boolean = false> {
  /**
   * A phantom marker, never read or assigned, that exists only so `HasReference` shows up in this
   * builder's own shape.
   *
   * @remarks
   * A generic parameter used only in a method's `this` type, the way {@link build} uses
   * `HasReference`, does not by itself make `TableForeignKeyBuilder<false>` and
   * `TableForeignKeyBuilder<true>` structurally different types — method shorthand is compared
   * leniently enough that TypeScript would still accept one where the other is expected. A private
   * field typed by the same parameter forces the two apart, which is what lets `Table`'s own
   * `.foreignKeys` refuse an array holding a `TableForeignKeyBuilder<false>` at the point it is
   * written, rather than only at the point `.build()` is called on it.
   */
  declare private readonly hasReference: HasReference;

  readonly #columns: UnmodifiableList<string>;
  #referencedTable?: string;
  #referencedColumns?: UnmodifiableList<string>;
  #onDelete?: ReferentialAction;
  #onUpdate?: ReferentialAction;
  #match?: ReferentialMatch;
  #name?: string;
  #deferrable?: boolean;
  #initiallyDeferred?: boolean;

  /** Opened by {@link TableForeignKeyFactory.columns}, never directly. */
  constructor(columns: UnmodifiableList<string>) {
    this.#columns = columns;
  }

  /** The table {@link columns} points at, and which of its columns, in the same order. Its primary key when `referencedColumns` is left out. */
  references(
    referencedTable: string,
    referencedColumns?: UnmodifiableList<string>,
  ): TableForeignKeyBuilder<true> {
    this.#referencedTable = referencedTable;
    this.#referencedColumns = referencedColumns;
    return this as unknown as TableForeignKeyBuilder<true>;
  }

  /** What happens to this row when the referenced row is deleted. Nothing special when left out. */
  onDelete(action: ReferentialAction): this {
    this.#onDelete = action;
    return this;
  }

  /** What happens to this row when the referenced row's key changes. Nothing special when left out. */
  onUpdate(action: ReferentialAction): this {
    this.#onUpdate = action;
    return this;
  }

  /** Whether every column of this key must be null together, or may be null independently. `simple` when left out. */
  match(mode: ReferentialMatch): this {
    this.#match = mode;
    return this;
  }

  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  name(name: string): this {
    this.#name = name;
    return this;
  }

  /** Lets this constraint wait until the end of its transaction to be checked, rather than immediately. */
  deferrable(initiallyDeferred = false): this {
    this.#deferrable = true;
    this.#initiallyDeferred = initiallyDeferred;
    return this;
  }

  /** This constraint, exactly as `Table` reads it once its own `.foreignKeys` callback returns. */
  build(this: TableForeignKeyBuilder<true>): TableForeignKey {
    return {
      columns: this.#columns,
      referencedTable: this.#referencedTable as string,
      referencedColumns: this.#referencedColumns,
      onDelete: this.#onDelete,
      onUpdate: this.#onUpdate,
      match: this.#match,
      name: this.#name,
      deferrable: this.#deferrable,
      initiallyDeferred: this.#initiallyDeferred,
    };
  }
}

/** Opens an `exclude` constraint, closed by {@link TableExcludeBuilder.build} once `Table` reads it back. */
export class TableExcludeFactory {
  /** The terms compared between two rows, at least one. */
  elements(elements: UnmodifiableList<ExcludeElement>): TableExcludeBuilder {
    return new TableExcludeBuilder(elements);
  }
}

/** An `exclude` constraint under construction, opened by {@link TableExcludeFactory.elements}. */
export class TableExcludeBuilder {
  readonly #elements: UnmodifiableList<ExcludeElement>;
  #using?: IndexAccessMethod;
  #where?: string;
  #name?: string;
  #deferrable?: boolean;
  #initiallyDeferred?: boolean;

  /** Opened by {@link TableExcludeFactory.elements}, never directly. */
  constructor(elements: UnmodifiableList<ExcludeElement>) {
    this.#elements = elements;
  }

  /** The index access method the constraint is backed by. `gist` covers the ordinary range-overlap case; `btree` cannot back an `exclude` constraint at all. */
  using(method: IndexAccessMethod): this {
    this.#using = method;
    return this;
  }

  /** Restricts the constraint to the rows where this raw Postgres predicate holds, making it a partial exclusion. Covers every row when left out. */
  where(predicate: string): this {
    this.#where = predicate;
    return this;
  }

  /** The name this constraint is created under. Postgres picks one on its own when left out. */
  name(name: string): this {
    this.#name = name;
    return this;
  }

  /** Lets this constraint wait until the end of its transaction to be checked, rather than immediately. */
  deferrable(initiallyDeferred = false): this {
    this.#deferrable = true;
    this.#initiallyDeferred = initiallyDeferred;
    return this;
  }

  /** This constraint, exactly as `Table` reads it once its own `.excludes` callback returns. */
  build(): ExcludeConstraint {
    return {
      elements: this.#elements,
      using: this.#using,
      where: this.#where,
      name: this.#name,
      deferrable: this.#deferrable,
      initiallyDeferred: this.#initiallyDeferred,
    };
  }
}

/** Opens an index, named `name`, closed by {@link TableIndexBuilder.build} once `Table` reads it back. */
export class TableIndexFactory {
  /** The name this index is created under. Unique across the whole package, not per table. */
  name(name: string): TableIndexBuilder {
    return new TableIndexBuilder(name);
  }
}

/**
 * An index under construction, opened by {@link TableIndexFactory.name}.
 *
 * @remarks
 * `HasColumns` tracks whether {@link columns} was called, and is the only reason this class takes
 * a type parameter at all: `Table`'s own `.indexes` only accepts `TableIndexBuilder<true>` in the
 * array its callback returns, so an index over nothing is refused where it is written, not where
 * `Table` later reads it.
 */
export class TableIndexBuilder<HasColumns extends boolean = false> {
  /** A phantom marker, never read or assigned, so `HasColumns` forces `TableIndexBuilder<false>` and `TableIndexBuilder<true>` apart — see {@link TableForeignKeyBuilder.hasReference} for why a `this`-typed method alone could not. */
  declare private readonly hasColumns: HasColumns;

  readonly #name: string;
  #columns?: UnmodifiableList<string | IndexColumn>;
  #unique?: boolean;
  #nullsNotDistinct?: boolean;
  #using?: IndexAccessMethod;
  #include?: UnmodifiableList<string>;
  #fillfactor?: number;
  #where?: string;

  /** Opened by {@link TableIndexFactory.name}, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /**
   * The columns this index covers, in the order Postgres will list them, at least one.
   *
   * @remarks
   * A bare string is read as an {@link IndexColumn.expression} with every other field left out;
   * reach for the object form only when an entry needs a collation, an operator class, or its own
   * sort order.
   */
  columns(columns: UnmodifiableList<string | IndexColumn>): TableIndexBuilder<true> {
    this.#columns = columns;
    return this as unknown as TableIndexBuilder<true>;
  }

  /** Refuses a row whose covered columns match one already stored. */
  unique(): this {
    this.#unique = true;
    return this;
  }

  /** Treats several nulls as a conflict, rather than as distinct from one another. Silently unused unless {@link unique} was also called. */
  nullsNotDistinct(): this {
    this.#nullsNotDistinct = true;
    return this;
  }

  /** The access method this index is built with. `btree` when left out, Postgres's own default. */
  using(method: IndexAccessMethod): this {
    this.#using = method;
    return this;
  }

  /** Extra columns this index carries for an index-only scan, without being part of the key itself. */
  include(columns: UnmodifiableList<string>): this {
    this.#include = columns;
    return this;
  }

  /** The fraction of each page Postgres leaves free for this index's own future growth, 10 to 100. Postgres's own default, 90, when left out. */
  fillfactor(value: number): this {
    this.#fillfactor = value;
    return this;
  }

  /** Restricts this index to the rows where this raw Postgres predicate holds, making it a partial index. Covers every row when left out. */
  where(predicate: string): this {
    this.#where = predicate;
    return this;
  }

  /** This index, exactly as `Table` reads it once its own `.indexes` callback returns. */
  build(this: TableIndexBuilder<true>): TableIndex {
    return {
      name: this.#name,
      columns: this.#columns as UnmodifiableList<string | IndexColumn>,
      unique: this.#unique,
      nullsNotDistinct: this.#nullsNotDistinct,
      using: this.#using,
      include: this.#include,
      fillfactor: this.#fillfactor,
      where: this.#where,
    };
  }
}

/** Opens a row-level security policy, named `name`, closed by {@link TablePolicyBuilder.build} once `Table` reads it back. */
export class TablePolicyFactory {
  /** The name this policy is created under. Unique across the whole package, not per table. */
  name(name: string): TablePolicyBuilder {
    return new TablePolicyBuilder(name);
  }
}

/** A row-level security policy under construction, opened by {@link TablePolicyFactory.name}. */
export class TablePolicyBuilder {
  readonly #name: string;
  #for?: PolicyCommand;
  #as?: PolicyKind;
  #to?: UnmodifiableList<PolicyRole>;
  #using?: string;
  #withCheck?: string;

  /** Opened by {@link TablePolicyFactory.name}, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** The statement this policy applies to. `all` when left out. */
  for(command: PolicyCommand): this {
    this.#for = command;
    return this;
  }

  /** Whether this policy narrows or additionally restricts. `permissive` when left out. */
  as(kind: PolicyKind): this {
    this.#as = kind;
    return this;
  }

  /** The roles this policy applies to. Every role when left out, Postgres's own default. */
  to(roles: UnmodifiableList<PolicyRole>): this {
    this.#to = roles;
    return this;
  }

  /**
   * The raw predicate a row must satisfy to be visible to `select`, or touchable by `update`/`delete`.
   *
   * @remarks
   * For `all` or `update` with no {@link withCheck} of its own, Postgres reuses this same
   * predicate to check the row being written, not only the row being read.
   */
  using(predicate: string): this {
    this.#using = predicate;
    return this;
  }

  /** The raw predicate a row written by `insert`, or the new value of a row touched by `update`, must satisfy. */
  withCheck(predicate: string): this {
    this.#withCheck = predicate;
    return this;
  }

  /** This policy, exactly as `Table` reads it once its own `.policies` callback returns. */
  build(): TablePolicy {
    return {
      name: this.#name,
      for: this.#for,
      as: this.#as,
      to: this.#to,
      using: this.#using,
      withCheck: this.#withCheck,
    };
  }
}

/** Opens a privilege grant on the table it sits on, closed by {@link TableGrantBuilder.build} once `Table` reads it back. */
export class TableGrantFactory {
  /** The privileges granted, or `"all"` for every privilege a table carries. */
  privileges(
    privileges: UnmodifiableList<Privilege> | "all",
  ): TableGrantBuilder {
    return new TableGrantBuilder(privileges);
  }
}

/**
 * A privilege grant on a table under construction, opened by {@link TableGrantFactory.privileges}.
 *
 * @remarks
 * `HasTo` tracks whether {@link to} was called, and is the only reason this class takes a type
 * parameter at all: `Table`'s own `.grants` only accepts `TableGrantBuilder<true>` in the array
 * its callback returns, so a grant with nobody to give it to is refused where it is written, not
 * where `Table` later reads it.
 */
export class TableGrantBuilder<HasTo extends boolean = false> {
  /** A phantom marker, never read or assigned, so `HasTo` forces `TableGrantBuilder<false>` and `TableGrantBuilder<true>` apart — see {@link TableForeignKeyBuilder.hasReference} for why a `this`-typed method alone could not. */
  declare private readonly hasTo: HasTo;

  readonly #privileges: UnmodifiableList<Privilege> | "all";
  #to?: UnmodifiableList<GrantRole>;
  #withGrantOption?: boolean;

  /** Opened by {@link TableGrantFactory.privileges}, never directly. */
  constructor(privileges: UnmodifiableList<Privilege> | "all") {
    this.#privileges = privileges;
  }

  /** The roles granted the privileges. */
  to(roles: UnmodifiableList<GrantRole>): TableGrantBuilder<true> {
    this.#to = roles;
    return this as unknown as TableGrantBuilder<true>;
  }

  /** Lets a grantee re-grant the same privileges to somebody else in turn. */
  withGrantOption(): this {
    this.#withGrantOption = true;
    return this;
  }

  /** This grant, exactly as `Table` reads it once its own `.grants` callback returns. */
  build(this: TableGrantBuilder<true>): TableGrant {
    return {
      privileges: this.#privileges,
      to: this.#to as UnmodifiableList<GrantRole>,
      withGrantOption: this.#withGrantOption,
    };
  }
}

/**
 * A Postgres table under construction, closed by {@link TableBuilder.columns}.
 *
 * @remarks
 * `.init()`, `.migrations()` or `.provisioning()` says which of a package's three `db` moments
 * this table, and everything `.indexes`, `.policies` and `.grants` carry, renders under — `init`,
 * played once against the package's own schema; `migrations`, applied once each through `dbmate`
 * as the package evolves; or `provisioning`, played before the package's own schema exists, where
 * a schema-qualified table has nowhere to go yet. Nothing here refuses `.provisioning()` for a
 * table even though it rarely makes sense there, the same reason a column's `default` is never
 * second-guessed either.
 *
 * A foreign key spanning two different moments is not checked either, and is a real hazard this
 * adds: a table declared for `migrations` that references one declared for `provisioning` may run
 * before the table it points at exists at all, since the three moments are not guaranteed to run
 * in that order relative to each other the way tables within one moment are.
 *
 * A column opened in `.columns` can carry a foreign key to another table this package declares, in
 * either order: nothing here checks that the table it names exists, because a table can be
 * declared before the rest of the package's schema is known to exist. Whatever renders the SQL
 * orders the tables so a referenced one is created first, and refuses when that is not possible.
 * The same is true of `.foreignKeys`, `.uniques`, `.checks`, `.indexes` and `.policies`: nothing
 * here checks that a column they name exists on this table, since Postgres itself is the one place
 * that already has to. `.grants` carries no name at all to check, the same reason the standalone
 * `Grant` does not either.
 *
 * A row a query against this table answers is a plain, unrelated TypeScript shape — a package
 * that wants one derived from its own columns rather than written by hand reaches for `RowOf`, in
 * `types/column.ts`.
 */
export class TableBuilder {
  readonly #name: string;
  readonly #moment: DbMoment;
  #primaryKey?: PrimaryKeyConstraint;
  #uniques: UnmodifiableList<UniqueConstraint> = [];
  #checks: UnmodifiableList<CheckConstraint> = [];
  #foreignKeys: UnmodifiableList<TableForeignKey> = [];
  #excludes: UnmodifiableList<ExcludeConstraint> = [];
  #indexes: UnmodifiableList<TableIndex> = [];
  #policies: UnmodifiableList<TablePolicy> = [];
  #grants: UnmodifiableList<TableGrant> = [];
  #fillfactor?: number;
  #unlogged?: boolean;

  /** Opened by one of {@link TableMoment}'s own methods, never directly. */
  constructor(name: string, moment: DbMoment) {
    this.#name = name;
    this.#moment = moment;
  }

  /**
   * Makes this table's primary key span every column named, rather than a single column.
   *
   * @throws {Error} When a column opened in `.columns` also calls `.isPrimary()`, raised where
   * `.columns` is read: a table has exactly one primary key, single-column or composite, never
   * both spellings on the same table.
   */
  primaryKey(
    build: (pk: TablePrimaryKeyFactory) => TablePrimaryKeyBuilder,
  ): this {
    this.#primaryKey = build(new TablePrimaryKeyFactory()).build();
    return this;
  }

  /** The `unique` constraints this table carries beyond a single column's own `.unique()`. */
  uniques(
    build: (
      factory: TableUniqueFactory,
    ) => UnmodifiableList<TableUniqueBuilder>,
  ): this {
    this.#uniques = build(new TableUniqueFactory()).map((constraint) => constraint.build());
    return this;
  }

  /** The `check` constraints this table carries, each free to read as many columns as it names. */
  checks(
    build: (factory: TableCheckFactory) => UnmodifiableList<TableCheckBuilder>,
  ): this {
    this.#checks = build(new TableCheckFactory()).map((constraint) => constraint.build());
    return this;
  }

  /** The `foreign key` constraints this table carries beyond a single column's own `.references`. */
  foreignKeys(
    build: (
      factory: TableForeignKeyFactory,
    ) => UnmodifiableList<TableForeignKeyBuilder<true>>,
  ): this {
    this.#foreignKeys = build(new TableForeignKeyFactory()).map((constraint) => constraint.build());
    return this;
  }

  /** The `exclude` constraints this table carries. */
  excludes(
    build: (
      factory: TableExcludeFactory,
    ) => UnmodifiableList<TableExcludeBuilder>,
  ): this {
    this.#excludes = build(new TableExcludeFactory()).map((constraint) => constraint.build());
    return this;
  }

  /**
   * The indexes this table carries.
   *
   * @remarks
   * An index always covers exactly one table, so there is no `table` to repeat here the way a
   * standalone declaration would need one: the table it is declared under already says which table
   * each entry belongs to.
   */
  indexes(
    build: (factory: TableIndexFactory) => UnmodifiableList<TableIndexBuilder<true>>,
  ): this {
    this.#indexes = build(new TableIndexFactory()).map((index) => index.build());
    return this;
  }

  /**
   * The row-level security policies this table carries.
   *
   * @remarks
   * A policy always guards exactly one table, so there is no `table` to repeat here the way a
   * standalone declaration would need one: the table it is declared under already says which table
   * each entry guards. A policy takes effect only once row-level security itself is switched on for
   * this table — `TableBuilder` carries no such switch today, so a package that wants one still
   * reaches for a raw `Sql("alter table ... enable row level security")` alongside its policies.
   */
  policies(
    build: (
      factory: TablePolicyFactory,
    ) => UnmodifiableList<TablePolicyBuilder>,
  ): this {
    this.#policies = build(new TablePolicyFactory()).map((policy) => policy.build());
    return this;
  }

  /**
   * The privilege grants this table carries.
   *
   * @remarks
   * A grant on a table is always tied to one table, so there is no {@link GrantOptions.on} to
   * repeat here: the table it is declared under already says which one, and `kind: "table"` is
   * implied. A grant on anything else — a schema, a sequence, a function, a domain, a type, or the
   * whole database — is not a table's to carry, and still goes through the standalone `Grant`.
   */
  grants(
    build: (factory: TableGrantFactory) => UnmodifiableList<TableGrantBuilder<true>>,
  ): this {
    this.#grants = build(new TableGrantFactory()).map((grant) => grant.build());
    return this;
  }

  /** The fraction of each page Postgres leaves free for this table's own future updates, 10 to 100. Postgres's own default, 100, when left out. */
  fillfactor(value: number): this {
    this.#fillfactor = value;
    return this;
  }

  /** Skips the write-ahead log for this table's own writes, trading crash safety and replication for speed. */
  unlogged(value = true): this {
    this.#unlogged = value;
    return this;
  }

  /**
   * Declares this table's columns, and with them the table itself, without reaching anything.
   *
   * @throws {Error} When `.primaryKey` was called and a column also calls `.isPrimary()`.
   * @throws {DuplicateDeclarationError} When this table's name has already been declared, raised
   * where this is called — or when one of `.indexes` names an index, or one of `.policies` names a
   * policy, already declared on this table or any other, since both an index name and a policy
   * name are unique across the whole package, not per table, regardless of which moment either
   * declaration belongs to.
   *
   * @example
   * ```ts ignore
   * Table("__accounts__").init().columns((c) => ({
   *   id: c.uuid().isPrimary(),
   *   email: c.varchar(320).isNullable(true),
   *   createdAt: c.timestamp({ withTimeZone: true }).default("now()"),
   * }));
   *
   * Table("__account_devices__").migrations()
   *   .primaryKey((pk) => pk.columns(["account_id", "device_id"]))
   *   .checks((ck) => [ck.expression("last_seen_at <= now()")])
   *   .indexes((i) => [i.name("__account_devices___account_idx__").columns(["account_id"])])
   *   .policies((p) => [p.name("__account_devices_self__").for("select").using("account_id = auth.uid()")])
   *   .grants((g) => [g.privileges(["select"]).to(["authenticated"])])
   *   .columns((c) => ({
   *     accountId: c.uuid(),
   *     deviceId: c.uuid(),
   *     lastSeenAt: c.timestamp({ withTimeZone: true }),
   *   }));
   * ```
   */
  columns(build: (c: ColumnFactory) => ColumnMap): DeclaredTable {
    const moment = this.#moment;
    const columns = columnsOf(build(new ColumnFactory()));

    if (
      this.#primaryKey &&
      Object.values(columns).some((column) => column.isPrimary)
    ) {
      throw new Error(
        `"${this.#name}" names a composite primary key and also carries a column-level "isPrimary()". ` +
          "A table has exactly one primary key: keep the one on the columns it spans, and drop the other.",
      );
    }

    const table: DeclaredTable = {
      name: this.#name,
      columns,
      primaryKey: this.#primaryKey ?? null,
      uniques: this.#uniques,
      checks: this.#checks,
      foreignKeys: this.#foreignKeys,
      excludes: this.#excludes,
      fillfactor: this.#fillfactor ?? null,
      unlogged: this.#unlogged === true,
    };
    declaredTable.declare(this.#name, { moment, table });

    for (const { name: indexName, ...indexOptions } of this.#indexes) {
      declaredIndex.declare(indexName, {
        moment,
        index: {
          name: indexName,
          options: { table: this.#name, ...indexOptions },
        },
      });
    }

    for (const { name: policyName, ...policyOptions } of this.#policies) {
      declaredPolicy.declare(policyName, {
        moment,
        policy: {
          name: policyName,
          options: { table: this.#name, ...policyOptions },
        },
      });
    }

    for (const grantOptions of this.#grants) {
      declareGrant(
        { ...grantOptions, on: { kind: "table", name: this.#name } },
        moment,
      );
    }

    return table;
  }
}

/**
 * The moment `Table`'s `name` renders under, not yet chosen — exposes only the three moments a
 * table can belong to, and nothing else, so no other method of `TableBuilder` ever appears before
 * the one choice every other choice it carries renders under.
 */
export class TableMoment {
  readonly #name: string;

  /** Opened by `Table`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Renders this table once, against the package's own schema. */
  init(): TableBuilder {
    return new TableBuilder(this.#name, "init");
  }

  /** Renders this table once, applied through `dbmate` as the package evolves. */
  migrations(): TableBuilder {
    return new TableBuilder(this.#name, "migrations");
  }

  /** Renders this table before the package's own schema exists. */
  provisioning(): TableBuilder {
    return new TableBuilder(this.#name, "provisioning");
  }
}

/**
 * Opens a Postgres table named `name`.
 *
 * @remarks
 * `Table` itself carries only a name: {@link TableMoment}, what it rends, only carries the three
 * moments a table can render under. Choosing one, `.init()` chief among them, is what hands back
 * the full `TableBuilder` — `.primaryKey`, `.uniques`, `.columns` and the rest never appear before
 * that choice is made.
 *
 * @example
 * ```ts ignore
 * Table("__bookings__").init().columns((c) => ({
 *   id: c.uuid().isPrimary(),
 *   status: c.enum("booking_status"),
 * }));
 * ```
 */
export function Table(name: string): TableMoment {
  return new TableMoment(name);
}

/** Every table this package has declared for `moment`, in the order it declared them. */
export function declaredTables(
  moment: DbMoment,
): UnmodifiableList<DeclaredTable> {
  return declaredTable
    .all()
    .filter((entry) => entry.moment === moment)
    .map((entry) => entry.table);
}

/** Forgets every declared table, which is what a test does between cases. */
export function forgetTables(): void {
  declaredTable.forget();
}

/** Every index this package has declared for `moment`, in the order it declared them. */
export function declaredIndexes(
  moment: DbMoment,
): UnmodifiableList<DeclaredIndex> {
  return declaredIndex
    .all()
    .filter((entry) => entry.moment === moment)
    .map((entry) => entry.index);
}

/** Forgets every declared index, which is what a test does between cases. */
export function forgetIndexes(): void {
  declaredIndex.forget();
}

/** Every policy this package has declared for `moment`, in the order it declared them. */
export function declaredPolicies(
  moment: DbMoment,
): UnmodifiableList<DeclaredPolicy> {
  return declaredPolicy
    .all()
    .filter((entry) => entry.moment === moment)
    .map((entry) => entry.policy);
}

/** Forgets every declared policy, which is what a test does between cases. */
export function forgetPolicies(): void {
  declaredPolicy.forget();
}
