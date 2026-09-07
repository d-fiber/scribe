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

import type { UnmodifiableList } from "../../../primitives/value/list.ts";
import type { SchemaNode } from "../moment.ts";
import { schemaNode } from "../moment.ts";

/** An enum exactly as {@link Enum} declared it. */
export interface DeclaredEnum {
  /** The name this enum is created under. */
  readonly name: string;

  /** The values this enum accepts, in the order Postgres will list them. */
  readonly values: UnmodifiableList<string>;
}

/**
 * A Postgres enum type named `name`, growing one value at a time, declared once a method marked
 * `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` answers it.
 *
 * @remarks
 * A column opened with `c.enum("booking_status")` takes this enum by name, in either order:
 * nothing here checks that the name it took resolves, because a column can be declared before the
 * rest of the package's schema is known to exist. Whatever renders the SQL is what refuses a name
 * that resolves to nothing.
 *
 * Unlike `Table` or `Type`, nothing here closes the chain with a call of its own: `schema.ts`'s own
 * collection step reads whatever {@link declaration} answers once it is ready for it, never before,
 * so a package author keeps calling {@link value} for as long as they like before the method that
 * declares this returns.
 */
export class EnumBuilder {
  readonly #name: string;
  readonly #values: string[] = [];

  /** Opened by `Enum`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Adds `value` to the values this enum accepts, in the order Postgres will list them. */
  value(value: string): this {
    this.#values.push(value);
    return this;
  }

  /**
   * This enum, read fresh from whatever {@link value} last added — `schema.ts`'s own collection
   * step is the only reader, and only once every `@SchemaInit`/`@SchemaMigration`/
   * `@SchemaProvisioning` method across a package's `db` schema has already returned.
   *
   * @throws {DuplicateDeclarationError} When this enum's name has already been declared, raised
   * where `schema.ts`'s own collection step runs, not here.
   */
  get declaration(): SchemaNode {
    return schemaNode("enum", { name: this.#name, values: this.#values });
  }
}

/**
 * Opens a Postgres enum type named `name`.
 *
 * @remarks
 * `Enum` no longer takes a moment of its own: nothing it builds declares by itself, and only
 * renders once a method marked `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` answers it.
 *
 * @example
 * ```ts ignore
 * class BookingStatus {
 *   @SchemaInit()
 *   status(): EnumBuilder {
 *     return Enum("booking_status").value("pending").value("confirmed").value("cancelled");
 *   }
 * }
 * ```
 */
export function Enum(name: string): EnumBuilder {
  return new EnumBuilder(name);
}
