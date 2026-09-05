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

/** A field of an `interval`, spelled the way `create table` takes it. */
export type IntervalFields =
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "year to month"
  | "day to hour"
  | "day to minute"
  | "day to second"
  | "hour to minute"
  | "hour to second"
  | "minute to second";

/** The subtype a built-in range or multirange is over — the six Postgres ships. */
export type RangeSubtype =
  | "integer"
  | "bigint"
  | "numeric"
  | "timestamp"
  | "timestamptz"
  | "date";

/**
 * The Postgres type a column holds, closed to what `Table` and `Type` accept.
 *
 * @remarks
 * `enum` and `composite` name another declaration by its key rather than holding it, because a
 * column can be declared before the rest of the schema is known to exist: a `{ kind: "enum", name:
 * "role" }` column only has to agree with an `Enum("role").values(...)` declared somewhere in the
 * same package, in either order — the same is true of `Type`.
 *
 * Left out on purpose: a Postgres domain (`create domain`), because a constraint on the shape of a
 * value belongs in the TypeScript that validates it before a request is ever sent, not in the
 * database schema — `money` (Postgres's own documentation steers a currency column toward
 * `numeric` instead), the SQL-standard `float(p)` spelling (`real`/`doublePrecision` already cover
 * every value `p` can pick), geometric operators and a user-defined `CREATE TYPE ... AS RANGE`
 * (this only ever produces one of the six ranges Postgres ships), and every object identifier type
 * (`oid`, `regclass`, ...), which addresses a system catalog rather than a value a package's own
 * table would hold.
 */
export type ColumnType =
  | { readonly kind: "uuid" }
  | { readonly kind: "boolean" }
  | { readonly kind: "text" }
  | { readonly kind: "varchar"; readonly length: number }
  | { readonly kind: "char"; readonly length: number }
  | { readonly kind: "smallint" }
  | { readonly kind: "integer" }
  | { readonly kind: "bigint" }
  | { readonly kind: "real" }
  | { readonly kind: "doublePrecision" }
  | {
    readonly kind: "numeric";
    readonly precision?: number;
    readonly scale?: number;
  }
  | { readonly kind: "smallserial" }
  | { readonly kind: "serial" }
  | { readonly kind: "bigserial" }
  | { readonly kind: "bytea" }
  | { readonly kind: "bit"; readonly length?: number }
  | { readonly kind: "varbit"; readonly length?: number }
  | { readonly kind: "date" }
  | {
    readonly kind: "time";
    readonly precision?: number;
    readonly withTimeZone?: boolean;
  }
  | {
    readonly kind: "timestamp";
    readonly precision?: number;
    readonly withTimeZone?: boolean;
  }
  | {
    readonly kind: "interval";
    readonly fields?: IntervalFields;
    readonly precision?: number;
  }
  | { readonly kind: "inet" }
  | { readonly kind: "cidr" }
  | { readonly kind: "macaddr" }
  | { readonly kind: "macaddr8" }
  | { readonly kind: "json" }
  | { readonly kind: "jsonb" }
  | { readonly kind: "xml" }
  | { readonly kind: "pgLsn" }
  | { readonly kind: "tsvector" }
  | { readonly kind: "tsquery" }
  | { readonly kind: "point" }
  | { readonly kind: "line" }
  | { readonly kind: "lseg" }
  | { readonly kind: "box" }
  | { readonly kind: "path" }
  | { readonly kind: "polygon" }
  | { readonly kind: "circle" }
  | {
    readonly kind: "range";
    readonly of: RangeSubtype;
    readonly multirange?: boolean;
  }
  | { readonly kind: "enum"; readonly name: string }
  | { readonly kind: "composite"; readonly name: string }
  | { readonly kind: "array"; readonly of: ColumnType };

/** What happens to a referencing row when the row it points at changes, spelled as `create table` takes it. */
export type ReferentialAction =
  | "no action"
  | "restrict"
  | "cascade"
  | "set null"
  | "set default";

/**
 * How a multi-column foreign key treats a null in one of its columns.
 *
 * @remarks
 * `simple`, the default, lets any column be null. `full` refuses a foreign key where some columns
 * are null and others are not: it is all or none. Postgres does not implement the SQL standard's
 * third option, `partial`, so it has no place here.
 */
export type ReferentialMatch = "simple" | "full";

/**
 * Whether a constraint may wait until the end of its transaction to be checked, rather than
 * immediately after the statement that would violate it.
 *
 * @remarks
 * Shared by every constraint Postgres allows to defer: a foreign key, a `unique` or `primary key`,
 * and an `exclude` constraint. A `check` and a `not null` constraint can never defer, so neither
 * carries this.
 */
export interface DeferrableOptions {
  /** Whether this constraint can be checked at the end of the transaction rather than immediately. */
  readonly deferrable?: boolean;

  /** Whether a deferrable constraint checks at the end of the transaction by default. Silently unused when {@link deferrable} is not set. */
  readonly initiallyDeferred?: boolean;
}

/** A foreign key, from a column to another table's column. */
export interface ColumnReference extends DeferrableOptions {
  /** The table this column points at. */
  readonly table: string;

  /** The column of {@link table} this column points at. Its primary key, `id`, when left out. */
  readonly column?: string;

  /** What happens to this row when the referenced row is deleted. Nothing special when left out. */
  readonly onDelete?: ReferentialAction;

  /** What happens to this row when the referenced row's key changes. Nothing special when left out. */
  readonly onUpdate?: ReferentialAction;

  /** Whether every column of a multi-column key must be null together, or may be null independently. `simple` when left out. */
  readonly match?: ReferentialMatch;
}

/**
 * The implicit sequence a `GENERATED ... AS IDENTITY` column is backed by.
 *
 * @remarks
 * This is Postgres's own recommended replacement for `smallserial`/`serial`/`bigserial`: the
 * three serial kinds stay in {@link ColumnType} because existing SQL uses them, but an identity
 * column is the SQL-standard spelling and avoids the two pitfalls a serial column carries — the
 * sequence it creates is not automatically owned by the column in older Postgres, and granting a
 * role access to the table does not, by itself, grant it access to the sequence.
 */
export interface IdentityOptions {
  /**
   * Whether this column refuses a value the caller supplies on its own — `insert`, without
   * `overriding system value`, is refused. `false` lets a caller's own value through, falling back
   * to the sequence only when none is given, which is the closer match to how a serial column
   * already behaves.
   */
  readonly always?: boolean;

  /** The value the sequence starts from. Its {@link minValue} when left out. */
  readonly startWith?: number;

  /** The step the sequence advances by on each value, negative for a descending sequence. `1` when left out. */
  readonly incrementBy?: number;

  /** The lowest value the sequence produces, or `"none"` for no floor. Postgres's own default for the column's type when left out entirely. */
  readonly minValue?: number | "none";

  /** The highest value the sequence produces, or `"none"` for no ceiling. Postgres's own default for the column's type when left out entirely. */
  readonly maxValue?: number | "none";

  /** How many values the sequence precomputes and holds in memory. `1` when left out. */
  readonly cache?: number;

  /** Whether the sequence wraps back to its bound once exhausted, rather than refusing a further value. */
  readonly cycle?: boolean;
}

/**
 * A column whose value Postgres computes from the rest of the row, rather than one a caller ever writes.
 *
 * @remarks
 * `storage: "stored"` computes the value once, at write time, and keeps it on disk like any other
 * column; `storage: "virtual"` recomputes it on every read instead, storing nothing. There is no
 * default here on purpose: the two carry different costs — a virtual column is refused where a
 * stored one already exists (an index reaching into it, a foreign key naming it), while a stored
 * one spends space and write time to save every future read — a package author has to pick.
 */
export interface GeneratedOptions {
  /**
   * The Postgres expression this column computes, in terms of this table's other columns.
   *
   * @remarks
   * Nothing here validates it, the same choice a column's `defaultValue` and a function's `body`
   * make for raw Postgres text no closed vocabulary covers. Postgres itself refuses one that reads
   * another generated column, or that is not immutable.
   */
  readonly expression: string;

  /** Whether the value is computed once and stored, or recomputed on every read. */
  readonly storage: "stored" | "virtual";
}

/**
 * The collation a collatable column sorts and compares under, by name. Postgres's own default for
 * its type when left out.
 *
 * @remarks
 * Only `text`, `varchar` and `char` carry this: Postgres calls these its collatable types, and
 * refuses the clause on any other, which is why no other {@link ColumnTypeOptions} member has it.
 */
export interface CollatableOptions {
  /** The collation this column sorts and compares under, by name. Postgres's own default for its type when left out. */
  readonly collation?: string;
}

/**
 * Makes the column an identity column, generating its value from an implicit sequence, when the
 * column's own type allows one.
 *
 * @remarks
 * Only `smallint`, `integer` and `bigint` carry this: Postgres refuses `generated ... as identity`
 * on every other type, `identity column type must be smallint, integer, or bigint` being its own
 * words for it, which is why no other {@link ColumnTypeOptions} member has it. Postgres also
 * refuses it alongside `defaultValue` or `generated` on the same column, a rule this does not
 * enforce, the same as every other cross-field rule an author is expected to hold.
 */
export interface IdentityCapableOptions {
  /** Makes this column an identity column, generating its value from an implicit sequence. */
  readonly identity?: IdentityOptions;
}

/**
 * The Postgres type `ColumnOptions` takes, one member per {@link ColumnType} that carries data of
 * its own — kept one kind per member, rather than a single member whose `type` field is itself a
 * union, so `Extract<ColumnTypeOptions, { type: K }>` can narrow to exactly one at a time, which
 * is what {@link ColumnBuilder} and `ColumnFactory` are built on.
 */
export type ColumnTypeOptions =
  | { readonly type: "uuid" }
  | { readonly type: "boolean" }
  | { readonly type: "real" }
  | { readonly type: "doublePrecision" }
  | { readonly type: "smallserial" }
  | { readonly type: "serial" }
  | { readonly type: "bigserial" }
  | { readonly type: "bytea" }
  | { readonly type: "date" }
  | { readonly type: "inet" }
  | { readonly type: "cidr" }
  | { readonly type: "macaddr" }
  | { readonly type: "macaddr8" }
  | { readonly type: "json" }
  | { readonly type: "jsonb" }
  | { readonly type: "xml" }
  | { readonly type: "pgLsn" }
  | { readonly type: "tsvector" }
  | { readonly type: "tsquery" }
  | { readonly type: "point" }
  | { readonly type: "line" }
  | { readonly type: "lseg" }
  | { readonly type: "box" }
  | { readonly type: "path" }
  | { readonly type: "polygon" }
  | { readonly type: "circle" }
  | ({ readonly type: "text" } & CollatableOptions)
  | ({ readonly type: "varchar"; readonly length: number } & CollatableOptions)
  | ({ readonly type: "char"; readonly length: number } & CollatableOptions)
  | ({ readonly type: "smallint" } & IdentityCapableOptions)
  | ({ readonly type: "integer" } & IdentityCapableOptions)
  | ({ readonly type: "bigint" } & IdentityCapableOptions)
  | {
    readonly type: "numeric";
    readonly precision?: number;
    readonly scale?: number;
  }
  | { readonly type: "bit"; readonly length?: number }
  | { readonly type: "varbit"; readonly length?: number }
  | {
    readonly type: "time";
    readonly precision?: number;
    readonly withTimeZone?: boolean;
  }
  | {
    readonly type: "timestamp";
    readonly precision?: number;
    readonly withTimeZone?: boolean;
  }
  | {
    readonly type: "interval";
    readonly fields?: IntervalFields;
    readonly precision?: number;
  }
  | {
    readonly type: "range";
    readonly of: RangeSubtype;
    readonly multirange?: boolean;
  }
  | { readonly type: "enum"; readonly name: string }
  | { readonly type: "composite"; readonly name: string };

/**
 * The constraints a column carries regardless of its Postgres type, folded into `ColumnOptions`
 * alongside {@link ColumnTypeOptions} — kept as its own interface so {@link ColumnBuilder} can
 * intersect it back onto one narrowed {@link ColumnTypeOptions} member at a time.
 *
 * @remarks
 * A field a `@Type` class carries can only ever be a bare type in Postgres: `isPrimary`,
 * `isNullable`, `unique`, `nullsNotDistinct`, `defaultValue`, `references` and `generated` are
 * silently unused there, because a composite type's field cannot carry any of them in Postgres.
 * `Table` reads all of it.
 */
export interface ColumnCommonOptions {
  /** Makes this column an array of its type, rather than one value of it. */
  readonly array?: boolean;

  /** Makes this column the table's primary key, which also refuses a null value. */
  readonly isPrimary?: boolean;

  /** Whether this column accepts a null value. Refuses one when set to `false`. Accepts one otherwise. */
  readonly isNullable?: boolean;

  /** Whether this column refuses a value another row already holds. */
  readonly unique?: boolean;

  /**
   * Whether a `unique` column treats several nulls as a conflict, rather than as distinct from one
   * another. Silently unused when {@link unique} is not set.
   */
  readonly nullsNotDistinct?: boolean;

  /**
   * A raw Postgres expression this column takes when a row does not give it one.
   *
   * @remarks
   * It is a raw expression, not a value: `"now()"`, `"false"`, `"'{}'::jsonb"`. Nothing here
   * validates it, because a default is arbitrary Postgres syntax no closed vocabulary covers —
   * unlike `collation` or `identity`, the type a caller picks does not narrow this: whether
   * `"now()"` belongs on this column is a fact about Postgres expressions no closed vocabulary
   * covers without actually parsing SQL, so it stays the author's own responsibility to get right.
   */
  readonly defaultValue?: string;

  /** The foreign key this column carries. It carries none when left out. */
  readonly references?: ColumnReference;

  /**
   * Makes this column computed from the rest of the row, rather than one a caller ever writes.
   *
   * @remarks
   * Postgres refuses this alongside `defaultValue`, `identity` or {@link references} on the same
   * column: a generated column may not be a foreign key, and cannot combine with another source
   * for its own value.
   */
  readonly generated?: GeneratedOptions;
}

/**
 * What a column takes: the Postgres type a field holds, and the constraints it carries.
 *
 * @remarks
 * `collation` and `identity` are narrower than the rest of {@link ColumnCommonOptions}, carried
 * only by the {@link ColumnTypeOptions} member whose own type allows them — see
 * {@link CollatableOptions} and {@link IdentityCapableOptions} — so a {@link ColumnBuilder} refuses
 * either at the type level on a builder whose own type does not allow it, rather than silently
 * dropping it.
 */
export type ColumnOptions = ColumnTypeOptions & ColumnCommonOptions;

/** A column exactly as a {@link ColumnBuilder} resolved it, read by whatever assembles the SQL it describes. */
export interface ColumnDefinition {
  /** The Postgres type this column holds. */
  readonly type: ColumnType;

  /** Whether this column refuses a null value. */
  readonly notNull: boolean;

  /** Whether this column is the table's primary key. */
  readonly isPrimary: boolean;

  /** Whether this column refuses a value another row already holds. */
  readonly unique: boolean;

  /** Whether a unique column treats several nulls as a conflict. Meaningless when {@link unique} is false. */
  readonly nullsNotDistinct: boolean;

  /** The collation this column sorts and compares under. Null when Postgres's own default for its type applies. */
  readonly collation: string | null;

  /** A raw Postgres expression this column takes when a row does not give it one. Null when it takes none. */
  readonly defaultSql: string | null;

  /** The foreign key this column carries. Null when it carries none. */
  readonly references: ColumnReference | null;

  /** The identity sequence this column is backed by. Null when it carries none. */
  readonly identity: IdentityOptions | null;

  /** How this column's value is computed from the rest of the row. Null when it is an ordinary column. */
  readonly generated: GeneratedOptions | null;
}

/**
 * The variant of {@link ColumnOptions} whose `type` is `Kind`, narrowed through
 * {@link ColumnTypeOptions} rather than through {@link ColumnOptions} itself.
 *
 * @remarks
 * `Extract` only distributes over a type that is a naked union at the point it is checked.
 * `ColumnTypeOptions` is one; `ColumnOptions` is not, since it is `ColumnTypeOptions &
 * ColumnCommonOptions` — an intersection, which `Extract` cannot see into. Narrowing
 * `ColumnTypeOptions` first and folding {@link ColumnCommonOptions} back on afterward keeps the
 * same result without running into that.
 */
type ColumnOptionsOf<Kind extends ColumnTypeOptions["type"]> =
  & Extract<
    ColumnTypeOptions,
    { readonly type: Kind }
  >
  & ColumnCommonOptions;

/**
 * `This`, the concrete subclass a flag-narrowing {@link ColumnBuilder} method was called on, with
 * its own accumulated options replaced by `NewO`.
 *
 * @remarks
 * `this` alone cannot express "the same subclass, a different type argument" — only "exactly the
 * type already held", which is why {@link ColumnBuilder.array}, {@link ColumnBuilder.isPrimary} and
 * {@link ColumnBuilder.isNullable} route their return type through this instead: it is what lets
 * `c.varchar(320).isPrimary().collation(...)` keep `.collation` in reach after a call that has
 * nothing to do with collation, by naming which of the three concrete builders `This` was before
 * reconstructing it with `NewO`. A fourth capability group would add a fourth branch here, the one
 * place this module would need to change for it.
 */
type WithFlags<This, NewO extends ColumnOptions> = This extends CollatableColumnBuilder<ColumnOptions>
  ? CollatableColumnBuilder<NewO>
  : This extends IdentityCapableColumnBuilder<ColumnOptions> ? IdentityCapableColumnBuilder<NewO>
  : ColumnBuilder<NewO>;

/**
 * A column under construction, returned by one of {@link ColumnFactory}'s type methods and refined
 * by whichever modifiers apply to it, in any order.
 *
 * @remarks
 * `O` grows as {@link array}, {@link isPrimary} and {@link isNullable} narrow it, which is what lets
 * `RowOf` read a precise TypeScript type back once `Table` or `Type` has resolved the column: every
 * other modifier only ever changes what Postgres does with the column, never the shape a row comes
 * back as, so none of them touch `O`.
 *
 * This is the base every column shares. `collation`, on {@link CollatableColumnBuilder}, and
 * `identity`, on {@link IdentityCapableColumnBuilder}, live on the two subclasses `ColumnFactory`
 * opens for the Postgres types that actually carry them — not here, and not behind a `this`
 * constraint that would still list them for a type that refuses them. A builder for `integer`
 * never has `.collation` to find in the first place; one for `text` never has `.identity`.
 */
export class ColumnBuilder<O extends ColumnOptions> {
  #options: ColumnOptions;

  /** Opened by one of {@link ColumnFactory}'s type methods, never directly. */
  constructor(options: O) {
    this.#options = options;
  }

  /**
   * Merges `fields` into this builder's accumulated options.
   *
   * @remarks
   * A real `#`-private field is invisible to a subclass, even one declared right below it in this
   * same file, so {@link CollatableColumnBuilder.collation} and
   * {@link IdentityCapableColumnBuilder.identity} reach {@link options} through this instead of
   * touching it directly — a method inherits normally, a private field does not.
   */
  protected patch(fields: Partial<ColumnOptions>): void {
    this.#options = { ...this.#options, ...fields } as ColumnOptions;
  }

  /** Makes this column an array of its type, rather than one value of it. */
  array<This extends ColumnBuilder<O>>(this: This): WithFlags<This, O & { readonly array: true }> {
    this.patch({ array: true });
    return this as unknown as WithFlags<This, O & { readonly array: true }>;
  }

  /** Makes this column the table's primary key, which also refuses a null value. */
  isPrimary<This extends ColumnBuilder<O>>(this: This): WithFlags<This, O & { readonly isPrimary: true }> {
    this.patch({ isPrimary: true });
    return this as unknown as WithFlags<This, O & { readonly isPrimary: true }>;
  }

  /** Whether this column accepts a null value. Refuses one when passed `false`. Accepts one otherwise, including when called with no argument. */
  isNullable<This extends ColumnBuilder<O>, Value extends boolean = true>(
    this: This,
    value: Value = true as Value,
  ): WithFlags<This, O & { readonly isNullable: Value }> {
    this.patch({ isNullable: value });
    return this as unknown as WithFlags<This, O & { readonly isNullable: Value }>;
  }

  /** Whether this column refuses a value another row already holds. */
  unique(): this {
    this.patch({ unique: true });
    return this;
  }

  /** Whether a `unique` column treats several nulls as a conflict, rather than as distinct from one another. Silently unused unless {@link unique} was also called. */
  nullsNotDistinct(): this {
    this.patch({ nullsNotDistinct: true });
    return this;
  }

  /**
   * A raw Postgres expression this column takes when a row does not give it one.
   *
   * @remarks
   * It is a raw expression, not a value: `"now()"`, `"false"`, `"'{}'::jsonb"`. Nothing here
   * validates it, because a default is arbitrary Postgres syntax no closed vocabulary covers.
   */
  default(sql: string): this {
    this.patch({ defaultValue: sql });
    return this;
  }

  /** Makes this column a foreign key, pointing at another table's column. */
  references(reference: ColumnReference): this {
    this.patch({ references: reference });
    return this;
  }

  /**
   * Makes this column computed from the rest of the row, rather than one a caller ever writes.
   *
   * @remarks
   * Postgres refuses this alongside `default`, `identity` or {@link references} on the same
   * column, a rule this does not enforce, the same as every other cross-field rule an author is
   * expected to hold.
   */
  generated(options: GeneratedOptions): this {
    this.patch({ generated: options });
    return this;
  }

  /** This column's options, exactly as `Table` and `Type` read them once their own callback returns. */
  build(): O {
    return this.#options as O;
  }
}

/**
 * A `text`, `varchar` or `char` column under construction — the only three Postgres calls its
 * collatable types, so the only three {@link ColumnFactory} opens as this rather than as a bare
 * {@link ColumnBuilder}.
 */
export class CollatableColumnBuilder<O extends ColumnOptions> extends ColumnBuilder<O> {
  /** Sets the collation this column sorts and compares under, by name. Postgres's own default for its type when left out. */
  collation(name: string): this {
    this.patch({ collation: name });
    return this;
  }
}

/**
 * A `smallint`, `integer` or `bigint` column under construction — the only three Postgres allows
 * `generated ... as identity` on, so the only three {@link ColumnFactory} opens as this rather than
 * as a bare {@link ColumnBuilder}.
 */
export class IdentityCapableColumnBuilder<O extends ColumnOptions> extends ColumnBuilder<O> {
  /**
   * Makes this column an identity column, generating its value from an implicit sequence.
   *
   * @remarks
   * `identity column type must be smallint, integer, or bigint` is Postgres's own words for why no
   * other column carries this.
   */
  identity(options: IdentityOptions = {}): this {
    this.patch({ identity: options });
    return this;
  }
}

/**
 * Opens a column of one Postgres type, refined by whichever {@link ColumnBuilder} modifiers
 * `Table`'s own `.columns` and `Type`'s own `.fields` callback chains onto it.
 *
 * @example
 * ```ts ignore
 * Table("__bookings__").init().columns((c) => ({
 *   id: c.uuid().isPrimary(),
 *   status: c.enum("booking_status"),
 *   guestCount: c.smallint().isNullable(false),
 *   createdAt: c.timestamp({ withTimeZone: true }).default("now()"),
 * }));
 * ```
 */
export class ColumnFactory {
  /** Opens a `uuid` column. */
  uuid(): ColumnBuilder<ColumnOptionsOf<"uuid">> {
    return new ColumnBuilder({ type: "uuid" });
  }

  /** Opens a `boolean` column. */
  boolean(): ColumnBuilder<ColumnOptionsOf<"boolean">> {
    return new ColumnBuilder({ type: "boolean" });
  }

  /** Opens a `text` column, collatable by name. */
  text(): CollatableColumnBuilder<ColumnOptionsOf<"text">> {
    return new CollatableColumnBuilder({ type: "text" });
  }

  /** Opens a `varchar` column, at most `length` characters long, collatable by name. */
  varchar(length: number): CollatableColumnBuilder<ColumnOptionsOf<"varchar">> {
    return new CollatableColumnBuilder({ type: "varchar", length });
  }

  /** Opens a `char` column, padded to exactly `length` characters, collatable by name. */
  char(length: number): CollatableColumnBuilder<ColumnOptionsOf<"char">> {
    return new CollatableColumnBuilder({ type: "char", length });
  }

  /** Opens a `smallint` column, capable of an identity sequence. */
  smallint(): IdentityCapableColumnBuilder<ColumnOptionsOf<"smallint">> {
    return new IdentityCapableColumnBuilder({ type: "smallint" });
  }

  /** Opens an `integer` column, capable of an identity sequence. */
  integer(): IdentityCapableColumnBuilder<ColumnOptionsOf<"integer">> {
    return new IdentityCapableColumnBuilder({ type: "integer" });
  }

  /** Opens a `bigint` column, capable of an identity sequence. */
  bigint(): IdentityCapableColumnBuilder<ColumnOptionsOf<"bigint">> {
    return new IdentityCapableColumnBuilder({ type: "bigint" });
  }

  /** Opens a `real` column. */
  real(): ColumnBuilder<ColumnOptionsOf<"real">> {
    return new ColumnBuilder({ type: "real" });
  }

  /** Opens a `double precision` column. */
  doublePrecision(): ColumnBuilder<ColumnOptionsOf<"doublePrecision">> {
    return new ColumnBuilder({ type: "doublePrecision" });
  }

  /** Opens a `numeric` column, optionally bounded to `precision` digits with `scale` of them after the point. */
  numeric(
    precision?: number,
    scale?: number,
  ): ColumnBuilder<ColumnOptionsOf<"numeric">> {
    return new ColumnBuilder({ type: "numeric", precision, scale });
  }

  /** Opens a `smallserial` column. */
  smallserial(): ColumnBuilder<ColumnOptionsOf<"smallserial">> {
    return new ColumnBuilder({ type: "smallserial" });
  }

  /** Opens a `serial` column. */
  serial(): ColumnBuilder<ColumnOptionsOf<"serial">> {
    return new ColumnBuilder({ type: "serial" });
  }

  /** Opens a `bigserial` column. */
  bigserial(): ColumnBuilder<ColumnOptionsOf<"bigserial">> {
    return new ColumnBuilder({ type: "bigserial" });
  }

  /** Opens a `bytea` column. */
  bytea(): ColumnBuilder<ColumnOptionsOf<"bytea">> {
    return new ColumnBuilder({ type: "bytea" });
  }

  /** Opens a `bit` column, `length` bits wide. Postgres's own default, one bit, when left out. */
  bit(length?: number): ColumnBuilder<ColumnOptionsOf<"bit">> {
    return new ColumnBuilder({ type: "bit", length });
  }

  /** Opens a `varbit` column, at most `length` bits wide. Unbounded when left out. */
  varbit(length?: number): ColumnBuilder<ColumnOptionsOf<"varbit">> {
    return new ColumnBuilder({ type: "varbit", length });
  }

  /** Opens a `date` column. */
  date(): ColumnBuilder<ColumnOptionsOf<"date">> {
    return new ColumnBuilder({ type: "date" });
  }

  /** Opens a `time` column. */
  time(
    options: {
      readonly precision?: number;
      readonly withTimeZone?: boolean;
    } = {},
  ): ColumnBuilder<ColumnOptionsOf<"time">> {
    return new ColumnBuilder({ type: "time", ...options });
  }

  /** Opens a `timestamp` column. */
  timestamp(
    options: {
      readonly precision?: number;
      readonly withTimeZone?: boolean;
    } = {},
  ): ColumnBuilder<ColumnOptionsOf<"timestamp">> {
    return new ColumnBuilder({ type: "timestamp", ...options });
  }

  /** Opens an `interval` column. */
  interval(
    options: {
      readonly fields?: IntervalFields;
      readonly precision?: number;
    } = {},
  ): ColumnBuilder<ColumnOptionsOf<"interval">> {
    return new ColumnBuilder({ type: "interval", ...options });
  }

  /** Opens an `inet` column. */
  inet(): ColumnBuilder<ColumnOptionsOf<"inet">> {
    return new ColumnBuilder({ type: "inet" });
  }

  /** Opens a `cidr` column. */
  cidr(): ColumnBuilder<ColumnOptionsOf<"cidr">> {
    return new ColumnBuilder({ type: "cidr" });
  }

  /** Opens a `macaddr` column. */
  macaddr(): ColumnBuilder<ColumnOptionsOf<"macaddr">> {
    return new ColumnBuilder({ type: "macaddr" });
  }

  /** Opens a `macaddr8` column. */
  macaddr8(): ColumnBuilder<ColumnOptionsOf<"macaddr8">> {
    return new ColumnBuilder({ type: "macaddr8" });
  }

  /** Opens a `json` column. */
  json(): ColumnBuilder<ColumnOptionsOf<"json">> {
    return new ColumnBuilder({ type: "json" });
  }

  /** Opens a `jsonb` column. */
  jsonb(): ColumnBuilder<ColumnOptionsOf<"jsonb">> {
    return new ColumnBuilder({ type: "jsonb" });
  }

  /** Opens an `xml` column. */
  xml(): ColumnBuilder<ColumnOptionsOf<"xml">> {
    return new ColumnBuilder({ type: "xml" });
  }

  /** Opens a `pg_lsn` column. */
  pgLsn(): ColumnBuilder<ColumnOptionsOf<"pgLsn">> {
    return new ColumnBuilder({ type: "pgLsn" });
  }

  /** Opens a `tsvector` column. */
  tsvector(): ColumnBuilder<ColumnOptionsOf<"tsvector">> {
    return new ColumnBuilder({ type: "tsvector" });
  }

  /** Opens a `tsquery` column. */
  tsquery(): ColumnBuilder<ColumnOptionsOf<"tsquery">> {
    return new ColumnBuilder({ type: "tsquery" });
  }

  /** Opens a `point` column. */
  point(): ColumnBuilder<ColumnOptionsOf<"point">> {
    return new ColumnBuilder({ type: "point" });
  }

  /** Opens a `line` column. */
  line(): ColumnBuilder<ColumnOptionsOf<"line">> {
    return new ColumnBuilder({ type: "line" });
  }

  /** Opens an `lseg` column. */
  lseg(): ColumnBuilder<ColumnOptionsOf<"lseg">> {
    return new ColumnBuilder({ type: "lseg" });
  }

  /** Opens a `box` column. */
  box(): ColumnBuilder<ColumnOptionsOf<"box">> {
    return new ColumnBuilder({ type: "box" });
  }

  /** Opens a `path` column. */
  path(): ColumnBuilder<ColumnOptionsOf<"path">> {
    return new ColumnBuilder({ type: "path" });
  }

  /** Opens a `polygon` column. */
  polygon(): ColumnBuilder<ColumnOptionsOf<"polygon">> {
    return new ColumnBuilder({ type: "polygon" });
  }

  /** Opens a `circle` column. */
  circle(): ColumnBuilder<ColumnOptionsOf<"circle">> {
    return new ColumnBuilder({ type: "circle" });
  }

  /** Opens a range column over `of`, or a multirange when `multirange` is set. */
  range(
    of: RangeSubtype,
    multirange?: boolean,
  ): ColumnBuilder<ColumnOptionsOf<"range">> {
    return new ColumnBuilder({ type: "range", of, multirange });
  }

  /** Opens a column typed as the enum `name` names, declared elsewhere in this package with `Enum`. */
  enum(name: string): ColumnBuilder<ColumnOptionsOf<"enum">> {
    return new ColumnBuilder({ type: "enum", name });
  }

  /** Opens a column typed as the composite type `name` names, declared elsewhere in this package with `Type`. */
  composite(name: string): ColumnBuilder<ColumnOptionsOf<"composite">> {
    return new ColumnBuilder({ type: "composite", name });
  }
}

/** What `Table` and `Type` take for their fields: a column builder, by the name it holds under. */
export type ColumnMap = Record<string, ColumnBuilder<ColumnOptions>>;

function columnType(options: ColumnOptions): ColumnType {
  const base: ColumnType = ((): ColumnType => {
    switch (options.type) {
      case "varchar":
        return { kind: "varchar", length: options.length };
      case "char":
        return { kind: "char", length: options.length };
      case "numeric":
        return {
          kind: "numeric",
          precision: options.precision,
          scale: options.scale,
        };
      case "bit":
        return { kind: "bit", length: options.length };
      case "varbit":
        return { kind: "varbit", length: options.length };
      case "time":
        return {
          kind: "time",
          precision: options.precision,
          withTimeZone: options.withTimeZone,
        };
      case "timestamp":
        return {
          kind: "timestamp",
          precision: options.precision,
          withTimeZone: options.withTimeZone,
        };
      case "interval":
        return {
          kind: "interval",
          fields: options.fields,
          precision: options.precision,
        };
      case "range":
        return {
          kind: "range",
          of: options.of,
          multirange: options.multirange,
        };
      case "enum":
        return { kind: "enum", name: options.name };
      case "composite":
        return { kind: "composite", name: options.name };
      default:
        return { kind: options.type } as ColumnType;
    }
  })();

  return options.array ? { kind: "array", of: base } : base;
}

/** A {@link ColumnMap} turned into what a table or a composite type carries, by field name. */
export function columnsOf(
  columnMap: ColumnMap,
): Record<string, ColumnDefinition> {
  const columns: Record<string, ColumnDefinition> = {};

  for (const [field, builder] of Object.entries(columnMap)) {
    const options = builder.build();
    columns[field] = {
      type: columnType(options),
      notNull: options.isPrimary === true || options.isNullable === false,
      isPrimary: options.isPrimary === true,
      unique: options.unique === true,
      nullsNotDistinct: options.nullsNotDistinct === true,
      collation: ("collation" in options ? options.collation : undefined) ?? null,
      defaultSql: options.defaultValue ?? null,
      references: options.references ? { ...options.references, column: options.references.column ?? "id" } : null,
      identity: ("identity" in options ? options.identity : undefined) ?? null,
      generated: options.generated ?? null,
    };
  }

  return columns;
}

/**
 * The closest plain TypeScript shape a value of `Type` comes back as, ignoring nullability and
 * {@link ColumnOptions.array} — {@link ColumnRowType} adds both back around this.
 *
 * @remarks
 * `enum` and `composite` widen to `string` and `Record<string, unknown>`: this only ever sees a
 * bare `{ type: "enum" | "composite", name }`, the same reason {@link ColumnType} does not hold the
 * enum's own values or the composite's own fields, so no closed union or shape can be read back
 * from it here either. `bigint`, every geometric type, `range`, `bit`/`varbit` and `interval` widen
 * to their closest safe shape rather than a precise one, the same reason `defaultValue` is never
 * validated: a fully faithful mapping would mean parsing Postgres's own textual representation of
 * each, which no closed vocabulary here attempts.
 */
export type ScalarTsType<Type extends ColumnOptions["type"]> = Type extends "boolean" ? boolean
  : Type extends
    | "smallint"
    | "integer"
    | "bigint"
    | "real"
    | "doublePrecision"
    | "numeric"
    | "smallserial"
    | "serial"
    | "bigserial" ? number
  : Type extends "bytea" ? Uint8Array
  : Type extends "json" | "jsonb" ? unknown
  : Type extends "composite" ? Record<string, unknown>
  : string;

/**
 * The TypeScript shape a value of `O` comes back as: {@link ScalarTsType} of its own type, wrapped
 * in an array when {@link ColumnOptions.array} is set, and unioned with `null` unless `O` is a
 * primary key or explicitly refuses one — the same rule {@link columnsOf} computes `notNull` from.
 */
export type ColumnRowType<O extends ColumnOptions> = (
  O extends { readonly array: true } ? Array<ScalarTsType<O["type"]>>
    : ScalarTsType<O["type"]>
) extends infer Value ? O extends { readonly isPrimary: true } ? Value
  : O extends { readonly isNullable: false } ? Value
  : Value | null
  : never;

/** The options a {@link ColumnBuilder} has accumulated, read back out of it. */
type OptionsOf<Builder> = Builder extends ColumnBuilder<infer O> ? O : never;

/**
 * The row shape `Columns` describes, one property per key, typed by {@link ColumnRowType}.
 *
 * @remarks
 * `Columns` has to keep each entry's own literal builder type for this to narrow anything, which a
 * plain `const columns = (c: ColumnFactory) => ({...})` already does on its own: nothing here
 * widens a chain like `c.uuid().isPrimary()` the way an object literal can widen `type: "uuid"` to
 * `string`, so no `as const` is needed to keep it.
 *
 * ```ts ignore
 * function bookingColumns(c: ColumnFactory) {
 *   return {
 *     id: c.uuid().isPrimary(),
 *     status: c.enum("booking_status"),
 *   };
 * }
 *
 * Table("__bookings__").init().columns(bookingColumns);
 *
 * type BookingRow = RowOf<ReturnType<typeof bookingColumns>>;
 * ```
 *
 * Nothing here requires it: a package that would rather write its row type by hand, the way a
 * `Tables<S>` schema in `port/database.ts` already expects one, is free to skip this entirely.
 */
export type RowOf<Columns extends ColumnMap> = {
  [K in keyof Columns]: ColumnRowType<OptionsOf<Columns[K]>>;
};
