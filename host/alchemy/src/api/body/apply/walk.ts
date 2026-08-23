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

import type { BodyFieldType, FormFieldType } from "../field_types.ts";
import { resolverFor } from "./resolvers/resolver_for.ts";
import { isRequiredEntry, unwrapFieldType } from "../markers.ts";

/** Everything a field may be declared as, whichever of the two shapes it belongs to. */
export type FieldType = BodyFieldType | FormFieldType;
/**
 * What hands back one raw field, before anything is made of it.
 *
 * It is what separates reading a body from reading a form: the walk over the shape is written
 * once, and where the values come from is passed in.
 */
export type ReadRawValue = (key: string, type: FieldType) => unknown;

/**
 * Reads every field a shape declares, and answers null when a mandatory one is missing.
 *
 * @remarks
 * It answers all or nothing on purpose. A caller handed half a body would have to check every
 * field again to know which half, so the check happens once here and the caller reads a value it
 * can trust or refuses the call.
 */
export function applySchema(
  schema: Record<string, unknown>,
  readRawValue: ReadRawValue,
  isForm: boolean,
): Record<string, unknown> | null {
  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(schema)) {
    const type = unwrapFieldType(entry) as FieldType;
    const value = resolverFor(type).resolve(
      readRawValue(key, type),
      isForm,
    );

    if (isRequiredEntry(entry) && isMissing(value)) return null;

    result[key] = value;
  }

  return result;
}

/**
 * Whether nothing arrived under a field that was marked mandatory.
 *
 * @remarks
 * Only absence counts. A text sent empty used to count too, which meant a mandatory text could
 * never be cleared: emptying a label or a note was refused as a body somebody forgot to fill, and
 * an endpoint that meant to accept it had no way of saying so. What a field may not be is the
 * endpoint's decision, and it is one it can now make.
 */
function isMissing(value: unknown): boolean {
  return value === null;
}
