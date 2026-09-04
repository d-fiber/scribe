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

import { Registry } from "../../declare/registry.ts";
import { columnsOf } from "./column.ts";
import type { ColumnDefinition, ColumnMetadata } from "./column.ts";
import type { UnmodifiableList } from "../../value/list.ts";

/** A table exactly as `@Table` declared it. */
export interface DeclaredTable {
  /** The name this table is created under. */
  readonly name: string;

  /** This table's columns, by field name, in the order the class declared them. */
  readonly columns: Readonly<Record<string, ColumnDefinition>>;
}

/** A class `new`-constructible with any arguments, which is all a class decorator asks of its target. */
type Constructible = new (...args: readonly unknown[]) => unknown;

/** Every table this package has declared, by the name it took. */
const declared = new Registry<DeclaredTable>("table");

/**
 * Declares the class it decorates a Postgres table named `name`, without reaching anything.
 *
 * @remarks
 * The class is answered unchanged: it stays exactly what a plain class already is, importable and
 * usable as the row type of a query against this table — through `schema<S>()`, in
 * `port/database.ts` — the same way any other TypeScript type is. Nothing here generates a second
 * type for that; the class **is** it.
 *
 * A `@Column` can carry a foreign key to another table this package declares, in either order:
 * nothing here checks that the table it names exists, because a table is built before the rest of
 * the package's schema is known to exist. Whatever renders the SQL orders the tables so a
 * referenced one is created first, and refuses when that is not possible.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where the
 * second declaration is written.
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
 *
 *   @Column({ type: "timestamptz", defaultValue: "now()" })
 *   createdAt!: string;
 * }
 * ```
 */
export function Table(name: string) {
  return function (
    _target: Constructible,
    context: ClassDecoratorContext,
  ): void {
    const metadata = context.metadata as ColumnMetadata;
    declared.declare(name, { name, columns: columnsOf(metadata) });
  };
}

/** Every table this package has declared, in the order it declared them. */
export function declaredTables(): UnmodifiableList<DeclaredTable> {
  return declared.all();
}

/** Forgets every declared table, which is what a test does between cases. */
export function forgetTables(): void {
  declared.forget();
}
