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

import type { ListMarker, NestedMarker, RequiredMarker } from "./markers.ts";

/**
 * What a field holding a single ordinary value is declared as.
 *
 * @remarks
 * The constructors stand in for the types they build, which is how a shape is written as a plain
 * object: `{ name: string }` says the field holds text. They are never called.
 */
export type PrimitiveType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ObjectConstructor;

/**
 * Everything a field of a JSON body may be declared as.
 *
 * A single value, a shape of its own, a list of either, or a list of shapes.
 */
export type BodyFieldType =
  | PrimitiveType
  | NestedMarker<BodySchema>
  | ListMarker<PrimitiveType | BodySchema>
  | ListMarker<NestedMarker<BodySchema>>;

/**
 * Everything a field of a form may be declared as.
 *
 * @remarks
 * It is what {@link BodyFieldType} allows, plus a file, which only a form can carry. `Object` is
 * not among them: a form field arrives as text or as a file, and nothing in between.
 */
export type FormFieldType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | typeof File
  | NestedMarker<BodySchema>
  | ListMarker<NestedMarker<BodySchema>>
  | ListMarker<PrimitiveType>
  | ListMarker<typeof File>;

/** What a body field is written as, with or without the mark that makes it mandatory. */
export type BodyFieldEntry = BodyFieldType | RequiredMarker<BodyFieldType>;

/** What a form field is written as, with or without the mark that makes it mandatory. */
export type FormFieldEntry = FormFieldType | RequiredMarker<FormFieldType>;

/**
 * What a JSON body has to be, written as a plain object.
 *
 * @example
 * ```ts ignore
 * const schema = { brand_id: Required(string), tags: ListOf(string) };
 * ```
 */
export type BodySchema = Record<string, BodyFieldEntry>;

/** What a form has to be, written the same way a body is. */
export type FormSchema = Record<string, FormFieldEntry>;
