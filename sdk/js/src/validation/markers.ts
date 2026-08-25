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

import type { BodyFieldCtor, BodySchema, FormFieldCtor, ScalarCtor } from "./field_types.ts";

export interface ArrMarker<C> {
  readonly _arr: true;
  readonly ctor: C;
}

export interface NestedMarker<S extends BodySchema> {
  readonly _nested: true;
  readonly schema: S;
}

export interface RequiredMarker<C> {
  readonly _required: true;
  readonly ctor: C;
}

export function Arr<
  C extends ScalarCtor | BodySchema | typeof File | NestedMarker<BodySchema>,
>(ctor: C): ArrMarker<C> {
  return { _arr: true, ctor };
}

export function Nested<S extends BodySchema>(schema: S): NestedMarker<S> {
  return { _nested: true, schema };
}

export function Required<C extends BodyFieldCtor | FormFieldCtor>(
  ctor: C,
): RequiredMarker<C> {
  return { _required: true, ctor };
}

function hasMarker(value: unknown, marker: string): boolean {
  return typeof value === "object" && value !== null && marker in value;
}

export function isArrMarker(entry: unknown): entry is ArrMarker<unknown> {
  return hasMarker(entry, "_arr");
}

export function isNestedMarker(
  entry: unknown,
): entry is NestedMarker<BodySchema> {
  return hasMarker(entry, "_nested");
}

export function isRequiredEntry<C>(
  entry: C | RequiredMarker<C>,
): entry is RequiredMarker<C> {
  return hasMarker(entry, "_required");
}

export function unwrapFieldCtor<C>(entry: C | RequiredMarker<C>): C {
  return isRequiredEntry(entry) ? entry.ctor : entry;
}
