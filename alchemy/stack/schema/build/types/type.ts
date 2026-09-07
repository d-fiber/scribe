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

import { ColumnFactory, columnsOf } from "./column.ts";
import type { ColumnMap, ColumnType } from "./column.ts";
import type { UnmodifiableList } from "../../../../primitives/value/list.ts";
import type { DbMoment } from "../moment.ts";
import { MomentRegistry, SchemaEntry } from "../moment.ts";

/** A composite type exactly as `Type` declared it. */
export interface DeclaredType {
  /** The name this type is created under. */
  readonly name: string;

  /** This type's fields, by field name, in the order `fields` gave them. */
  readonly fields: Readonly<Record<string, ColumnType>>;
}

/** Every type this package has declared, by the name it took. */
const declared = new MomentRegistry<DeclaredType>("type");

/**
 * Opens a Postgres composite type named `name`, closed by {@link TypeBuilder.fields}.
 *
 * @remarks
 * A column that takes this type by name still spells it `c.composite("location_coordinate")`, not
 * `"type"`: that is the Postgres category the name resolves to, and it does not change with what
 * this declares itself with. `Enum` is the other way a package names its own type, kept apart
 * because it is a different Postgres statement, `create type ... as enum` where this one is
 * `create type ... as (...)`.
 */
export class TypeBuilder {
  readonly #name: string;

  /** Opened by `Type`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /**
   * Closes this type, ready for a `Schema` batch to declare it under the moment that batch opened.
   *
   * @remarks
   * Each entry of `fields` is a {@link ColumnBuilder}, the same vocabulary `Table`'s own `.columns`
   * takes, but only the type it carries is read: a composite type's field can never carry
   * `isPrimary`, `isNullable`, `unique`, `defaultValue` or `references` in Postgres, so any of
   * those given here is silently unused.
   *
   * @throws {DuplicateDeclarationError} When this type's name has already been declared, raised
   * where `declareInto` runs — see `Table.columns`'s own remarks for why that is no longer where
   * this call sits.
   */
  fields(build: (c: ColumnFactory) => ColumnMap): SchemaEntry<DeclaredType> {
    const columnFields: Record<string, ColumnType> = {};
    for (const [field, definition] of Object.entries(columnsOf(build(new ColumnFactory())))) {
      columnFields[field] = definition.type;
    }
    return new SchemaEntry((moment) =>
      declared.declare(this.#name, moment, { name: this.#name, fields: columnFields })
    );
  }
}

/**
 * Opens a Postgres composite type named `name`.
 *
 * @remarks
 * `Type` no longer takes a moment of its own: `.fields`'s own return value declares nothing by
 * itself, and only renders once handed to one of `Schema`'s own `.init`, `.migrations` or
 * `.provisioning` batches.
 *
 * @example
 * ```ts ignore
 * dbSchema.init().with((w) => [
 *   w.type("location_coordinate").fields((c) => ({
 *     latitude: c.text(),
 *     longitude: c.text(),
 *   })),
 * ]);
 * ```
 */
export function Type(name: string): TypeBuilder {
  return new TypeBuilder(name);
}

/** Every type this package has declared for `moment`, in the order it declared them. */
export function declaredTypes(moment: DbMoment): UnmodifiableList<DeclaredType> {
  return declared.at(moment);
}

/** Forgets every declared type, which is what a test does between cases. */
export function forgetTypes(): void {
  declared.forget();
}
