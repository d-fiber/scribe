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

import { Registry } from "../../../../declare/registry.ts";
import type { UnmodifiableList } from "../../../../value/list.ts";
import type { DbMoment, SchemaAddable } from "../moment.ts";

/** An enum exactly as {@link Enum} declared it. */
export interface DeclaredEnum {
  /** The name this enum is created under. */
  readonly name: string;

  /** The values this enum accepts, in the order Postgres will list them. */
  readonly values: UnmodifiableList<string>;
}

/** An enum, and the moment it belongs to — not part of {@link DeclaredEnum} itself, since which moment an enum belongs to is where it is filed, not a fact carried on the enum. */
interface StoredEnum {
  /** The moment this enum belongs to. */
  readonly moment: DbMoment;

  /** The enum exactly as `Enum` declared it. */
  readonly enum: DeclaredEnum;
}

/** Every enum this package has declared, by the name it took. */
const declared = new Registry<StoredEnum>("enum");

/**
 * A Postgres enum type named `name`, growing one value at a time, declared once handed to one of
 * `Schema`'s own `.init`, `.migrations` or `.provisioning` batches.
 *
 * @remarks
 * A column opened with `c.enum("booking_status")` takes this enum by name, in either order:
 * nothing here checks that the name it took resolves, because a column can be declared before the
 * rest of the package's schema is known to exist. Whatever renders the SQL is what refuses a name
 * that resolves to nothing.
 *
 * Unlike `Table` or `Type`, nothing here closes the chain with a call of its own: `Schema`'s own
 * `.with` reads whatever `.value` last answered directly, so `EnumBuilder` implements
 * {@link SchemaAddable} itself, rather than answering a `SchemaEntry` the way a closing call would.
 */
export class EnumBuilder implements SchemaAddable<DeclaredEnum> {
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
   * Registers this enum for `moment`, called by `Schema`'s own `.with`, never directly.
   *
   * @throws {DuplicateDeclarationError} When this enum's name has already been declared.
   */
  declareInto(moment: DbMoment): DeclaredEnum {
    return declared.declare(this.#name, { moment, enum: { name: this.#name, values: this.#values } }).enum;
  }
}

/**
 * Opens a Postgres enum type named `name`.
 *
 * @remarks
 * `Enum` no longer takes a moment of its own: nothing it builds declares by itself, and only
 * renders once handed to one of `Schema`'s own `.init`, `.migrations` or `.provisioning` batches.
 *
 * @example
 * ```ts ignore
 * dbSchema.init().with((w) => [
 *   w.enum("booking_status").value("pending").value("confirmed").value("cancelled"),
 * ]);
 * ```
 */
export function Enum(name: string): EnumBuilder {
  return new EnumBuilder(name);
}

/** Every enum this package has declared for `moment`, in the order it declared them. */
export function declaredEnums(moment: DbMoment): UnmodifiableList<DeclaredEnum> {
  return declared.all().filter((entry) => entry.moment === moment).map((entry) => entry.enum);
}

/** Forgets every declared enum, which is what a test does between cases. */
export function forgetEnums(): void {
  declared.forget();
}
