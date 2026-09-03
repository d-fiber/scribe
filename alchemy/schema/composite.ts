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

import { Registry } from "../declare/registry.ts";
import { columnsOf } from "./column.ts";
import type { ColumnMetadata, ColumnType } from "./column.ts";
import type { UnmodifiableList } from "../value/list.ts";

/** A composite type exactly as `@CompositeType` declared it. */
export interface DeclaredCompositeType {
  /** The name this type is created under. */
  readonly name: string;

  /** This type's fields, by field name, in the order the class declared them. */
  readonly fields: Readonly<Record<string, ColumnType>>;
}

/** A class `new`-constructible with any arguments, which is all a class decorator asks of its target. */
type Constructible = new (...args: readonly unknown[]) => unknown;

/** Every composite type this package has declared, by the name it took. */
const declared = new Registry<DeclaredCompositeType>("type");

/**
 * Declares the class it decorates a Postgres composite type named `name`, without reaching
 * anything.
 *
 * @remarks
 * Its fields are declared with `@Column`, the same decorator a `@Table` class uses, but only the
 * type each carries is read: a composite type's field can never carry `primaryKey`, `nullable`,
 * `unique`, `defaultValue` or `references` in Postgres, so any of those passed to a `@Column` here
 * is silently unused.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * @CompositeType("location_coordinate")
 * class LocationCoordinate {
 *   @Column({ type: "text" })
 *   latitude!: string;
 *
 *   @Column({ type: "text" })
 *   longitude!: string;
 * }
 * ```
 */
export function CompositeType(name: string) {
  return function (_target: Constructible, context: ClassDecoratorContext): void {
    const metadata = context.metadata as ColumnMetadata;
    const fields: Record<string, ColumnType> = {};
    for (const [field, definition] of Object.entries(columnsOf(metadata))) {
      fields[field] = definition.type;
    }
    declared.declare(name, { name, fields });
  };
}

/** Every composite type this package has declared, in the order it declared them. */
export function declaredCompositeTypes(): UnmodifiableList<DeclaredCompositeType> {
  return declared.all();
}

/** Forgets every declared composite type, which is what a test does between cases. */
export function forgetCompositeTypes(): void {
  declared.forget();
}
