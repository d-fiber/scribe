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

import type { BodyFieldType, BodySchema, FormFieldType, PrimitiveType } from "./field_types.ts";

/**
 * A field that holds several values rather than one.
 *
 * @remarks
 * It is what {@link ListOf} answers, and it is read rather than built by hand. The brand is a field
 * nothing else carries, which is how a schema tells one of these from a plain constructor sitting
 * in the same position.
 */
export interface ListMarker<T> {
  /** The brand, which is what {@link isListMarker} looks for. */
  readonly _list: true;

  /** What each value of the list has to be. */
  readonly type: T;
}

/**
 * A field that holds a shape of its own.
 *
 * @remarks
 * It is what {@link Nested} answers. The schema it carries is read the same way the outer one is,
 * so a shape may hold a shape as deep as it is written.
 */
export interface NestedMarker<S extends BodySchema> {
  /** The brand, which is what {@link isNestedMarker} looks for. */
  readonly _nested: true;

  /** What the field's own shape is. */
  readonly schema: S;
}

/**
 * A field that has to be there.
 *
 * @remarks
 * It is what {@link Required} answers. Absence is the default, so this is the only thing that makes
 * a field mandatory, and a body missing one is refused rather than answered with a hole.
 */
export interface RequiredMarker<T> {
  /** The brand, which is what {@link isRequiredEntry} looks for. */
  readonly _required: true;

  /** What the field has to be, once it is known to be there. */
  readonly type: T;
}

/**
 * A field holding several `type`.
 *
 * @example
 * ```ts
 * const schema = { tags: ListOf(string), sizes: ListOf(Number) };
 * ```
 */
export function ListOf<
  T extends PrimitiveType | BodySchema | typeof File | NestedMarker<BodySchema>,
>(type: T): ListMarker<T> {
  return { _list: true, type };
}

/**
 * A field holding the shape `schema` describes.
 *
 * @example
 * ```ts
 * const schema = { owner: Nested({ id: Required(string), name: string }) };
 * ```
 */
export function Nested<S extends BodySchema>(schema: S): NestedMarker<S> {
  return { _nested: true, schema };
}

/**
 * A field that has to be there, holding `type`.
 *
 * @remarks
 * It wraps whatever the field would have been, marker included, so a mandatory list is written
 * `Required(ListOf(string))` and reads in that order.
 *
 * @example
 * ```ts
 * const schema = { brand_id: Required(string), note: string };
 * ```
 */
export function Required<T extends BodyFieldType | FormFieldType>(type: T): RequiredMarker<T> {
  return { _required: true, type };
}

/** Whether `value` carries `marker`, which is how every brand below is recognised. */
function hasMarker(value: unknown, marker: string): boolean {
  return typeof value === "object" && value !== null && marker in value;
}

/** Whether `entry` asks for several values rather than one. */
export function isListMarker(entry: unknown): entry is ListMarker<unknown> {
  return hasMarker(entry, "_list");
}

/** Whether `entry` asks for a shape of its own. */
export function isNestedMarker(entry: unknown): entry is NestedMarker<BodySchema> {
  return hasMarker(entry, "_nested");
}

/** Whether `entry` has to be there. */
export function isRequiredEntry<T>(entry: T | RequiredMarker<T>): entry is RequiredMarker<T> {
  return hasMarker(entry, "_required");
}

/**
 * What `entry` asks for, with the mandatory wrapper taken off when there is one.
 *
 * It is what every reader calls first, so that the rest of it only ever sees what the field holds
 * and never has to ask again whether it was mandatory.
 */
export function unwrapFieldType<T>(entry: T | RequiredMarker<T>): T {
  return isRequiredEntry(entry) ? entry.type : entry;
}
