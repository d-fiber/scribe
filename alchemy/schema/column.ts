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

/**
 * The Postgres type a column holds, closed to what `@Table` and `@CompositeType` accept.
 *
 * @remarks
 * `enum` and `composite` name another declaration by its key rather than holding it, because a
 * field is decorated before the rest of the schema is known to exist: a `{ type: "enum", name:
 * "role" }` column only has to agree with an `Enum("role", ...)` declared somewhere in the same
 * package, in either order.
 */
export type ColumnType =
  | { readonly kind: "uuid" }
  | { readonly kind: "text" }
  | { readonly kind: "varchar"; readonly length: number }
  | { readonly kind: "bigint" }
  | { readonly kind: "integer" }
  | { readonly kind: "boolean" }
  | { readonly kind: "timestamptz" }
  | { readonly kind: "jsonb" }
  | { readonly kind: "bigserial" }
  | { readonly kind: "enum"; readonly name: string }
  | { readonly kind: "composite"; readonly name: string }
  | { readonly kind: "array"; readonly of: ColumnType };

/** What happens to a referencing row when the row it points at is deleted. */
export type OnDelete = "cascade" | "restrict" | "set null";

/** A foreign key, from a column to another table's column. */
export interface ColumnReference {
  /** The table this column points at. */
  readonly table: string;

  /** The column of {@link table} this column points at. Its primary key, `id`, when left out. */
  readonly column?: string;

  /** What happens to this row when the referenced row is deleted. Nothing special when left out. */
  readonly onDelete?: OnDelete;
}

/** The Postgres type `@Column` takes, one shape per {@link ColumnType} that carries data of its own. */
export type ColumnTypeOptions =
  | { readonly type: "uuid" | "text" | "bigint" | "integer" | "boolean" | "timestamptz" | "jsonb" | "bigserial" }
  | { readonly type: "varchar"; readonly length: number }
  | { readonly type: "enum"; readonly name: string }
  | { readonly type: "composite"; readonly name: string };

/**
 * What `@Column` takes: the Postgres type a field holds, and the constraints it carries.
 *
 * @remarks
 * A field a `@CompositeType` class carries can only ever be a bare type in Postgres: `primaryKey`,
 * `nullable`, `unique`, `defaultValue` and `references` are silently unused there, because a
 * composite type's field cannot carry any of them in Postgres. `@Table` reads all of it.
 */
export type ColumnOptions = ColumnTypeOptions & {
  /** Makes this column an array of its type, rather than one value of it. */
  readonly array?: boolean;

  /** Makes this column the table's primary key, which also refuses a null value. */
  readonly primaryKey?: boolean;

  /** Whether this column accepts a null value. Refuses one when set to `false`. Accepts one otherwise. */
  readonly nullable?: boolean;

  /** Whether this column refuses a value another row already holds. */
  readonly unique?: boolean;

  /**
   * A raw Postgres expression this column takes when a row does not give it one.
   *
   * @remarks
   * It is a raw expression, not a value: `"now()"`, `"false"`, `"'{}'::jsonb"`. Nothing here
   * validates it, because a default is arbitrary Postgres syntax no closed vocabulary covers.
   */
  readonly defaultValue?: string;

  /** The foreign key this column carries. It carries none when left out. */
  readonly references?: ColumnReference;
};

/** A column exactly as `@Column` built it, read by whatever assembles the SQL it describes. */
export interface ColumnDefinition {
  /** The Postgres type this column holds. */
  readonly type: ColumnType;

  /** Whether this column refuses a null value. */
  readonly notNull: boolean;

  /** Whether this column is the table's primary key. */
  readonly primaryKey: boolean;

  /** Whether this column refuses a value another row already holds. */
  readonly unique: boolean;

  /** A raw Postgres expression this column takes when a row does not give it one. Null when it takes none. */
  readonly defaultSql: string | null;

  /** The foreign key this column carries. Null when it carries none. */
  readonly references: ColumnReference | null;
}

/**
 * What every `@Column` applied to one class collected, by the field name it decorates.
 *
 * @remarks
 * It is held on the class's own decorator metadata, the one piece of state every decorator
 * applied to a class and its members shares: each `@Column` writes its field's options in here as
 * it runs, and `@Table` or `@CompositeType` reads the whole of it once every field has.
 */
export type ColumnMetadata = Record<string, ColumnOptions>;

/**
 * Decorates a field with the column or the composite type field it declares.
 *
 * @remarks
 * Nothing here reaches anything: it only records `options` under the field's name, on the class's
 * decorator metadata. `@Table` or `@CompositeType`, applied to the class itself, is what turns the
 * metadata every field collected into a declaration — and native decorators run every field
 * decorator before the class decorator that sits above them, so the metadata is always whole by
 * the time either reads it.
 *
 * @example
 * ```ts ignore
 * @Table("__accounts__")
 * class Account {
 *   @Column({ type: "uuid", primaryKey: true })
 *   id!: string;
 *
 *   @Column({ type: "varchar", length: 320, nullable: true })
 *   email?: string;
 * }
 * ```
 */
export function Column(options: ColumnOptions) {
  return function (_value: undefined, context: ClassFieldDecoratorContext): void {
    const held = context.metadata as ColumnMetadata;
    held[String(context.name)] = options;
  };
}

function columnType(options: ColumnOptions): ColumnType {
  const base: ColumnType = options.type === "varchar"
    ? { kind: "varchar", length: options.length }
    : options.type === "enum"
    ? { kind: "enum", name: options.name }
    : options.type === "composite"
    ? { kind: "composite", name: options.name }
    : { kind: options.type };

  return options.array ? { kind: "array", of: base } : base;
}

/** {@link ColumnMetadata} turned into what a table or a composite type carries, by field name. */
export function columnsOf(metadata: ColumnMetadata): Record<string, ColumnDefinition> {
  const columns: Record<string, ColumnDefinition> = {};

  for (const [field, options] of Object.entries(metadata)) {
    columns[field] = {
      type: columnType(options),
      notNull: options.primaryKey === true || options.nullable === false,
      primaryKey: options.primaryKey === true,
      unique: options.unique === true,
      defaultSql: options.defaultValue ?? null,
      references: options.references ? { ...options.references, column: options.references.column ?? "id" } : null,
    };
  }

  return columns;
}
