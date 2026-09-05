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

/** An enum exactly as {@link Enum} declared it. */
export interface DeclaredEnum {
  /** The name this enum is created under. */
  readonly name: string;

  /** The values this enum accepts, in the order Postgres will list them. */
  readonly values: UnmodifiableList<string>;
}

/** Every enum this package has declared, by the name it took. */
const declared = new Registry<DeclaredEnum>("enum");

/**
 * A Postgres enum type named `name`, growing one value at a time.
 *
 * @remarks
 * A column opened with `c.enum("booking_status")` takes this enum by name, in either order:
 * nothing here checks that the name it took resolves, because a column can be declared before the
 * rest of the package's schema is known to exist. Whatever renders the SQL is what refuses a name
 * that resolves to nothing.
 *
 * `Enum` declares under `name` the moment it is called, holding no value yet: unlike `Table` or
 * `Type`, nothing here closes the chain, so declaring at the first opportunity is what makes
 * `DuplicateDeclarationError` land on the line that reused a name, rather than on whichever
 * `.value` call happens to run last. `values` is the same array `Enum` handed to the `Registry`,
 * so every `.value` call is read the moment anything reads {@link declaredEnums} back, no matter
 * how much later that happens to be.
 */
export class EnumBuilder {
  readonly #values: string[];

  /** Opened by `Enum`, never directly. */
  constructor(name: string) {
    this.#values = [];
    declared.declare(name, { name, values: this.#values });
  }

  /** Adds `value` to the values this enum accepts, in the order Postgres will list them. */
  value(value: string): this {
    this.#values.push(value);
    return this;
  }
}

/**
 * Opens a Postgres enum type named `name`.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where this is
 * called.
 *
 * @example
 * ```ts ignore
 * Enum("booking_status").value("pending").value("confirmed").value("cancelled");
 * ```
 */
export function Enum(name: string): EnumBuilder {
  return new EnumBuilder(name);
}

/** Every enum this package has declared, in the order it declared them. */
export function declaredEnums(): UnmodifiableList<DeclaredEnum> {
  return declared.all();
}

/** Forgets every declared enum, which is what a test does between cases. */
export function forgetEnums(): void {
  declared.forget();
}
