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
 * What an endpoint says its input must be, and what reads a body against it.
 *
 * @remarks
 * A shape is written where the endpoint is, as a plain object whose values name what each field
 * holds: `{ brand_id: Required(String), tags: ListOf(String) }`. The names, the types and which
 * fields may be null are all read back out of that one object, so the shape is written once and
 * never declared a second time for the compiler.
 *
 * Nothing here reads a request. It is handed bytes or a form, and it answers either the shape it
 * was asked for or null, which is what lets an endpoint refuse in one line.
 */

export { isListMarker, isNestedMarker, isRequiredEntry, ListOf, Nested, Required, unwrapFieldType } from "./markers.ts";
export type { ListMarker, NestedMarker, RequiredMarker } from "./markers.ts";

export type {
  BodyFieldEntry,
  BodyFieldType,
  BodySchema,
  FormFieldEntry,
  FormFieldType,
  FormSchema,
  PrimitiveType,
} from "./field_types.ts";

export type { BodyFieldResult, BodyFromSchema, FormFieldResult, FormFromSchema } from "./inference.ts";

export { parseBodyBytes, parseFormBytes } from "./parse.ts";

export { applySchema } from "./apply/walk.ts";
export type { FieldType, ReadRawValue } from "./apply/walk.ts";

export { applyBodySchema } from "./apply/body.ts";
export { applyFormSchema } from "./apply/form.ts";

export { resolverFor } from "./apply/resolvers/resolver_for.ts";
export type { FieldResolver } from "./apply/resolvers/resolver.ts";
