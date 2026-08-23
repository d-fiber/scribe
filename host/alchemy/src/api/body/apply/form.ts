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

import type { List } from "../../../value/list.ts";
import type { FormFieldType, FormSchema } from "../field_types.ts";
import type { FormFromSchema } from "../inference.ts";
import { isListMarker, isNestedMarker } from "../markers.ts";
import { applySchema, type FieldType } from "./walk.ts";

/**
 * The shape `schema` describes, read out of a form.
 *
 * @remarks
 * Everything in a form arrives as text or as a file, so a number and a boolean are read out of
 * their spelling rather than taken as they are. A field declared as a list is gathered from every
 * entry sharing its name, which is how a form spells several values.
 */
export function applyFormSchema<S extends FormSchema>(
  schema: S,
  form: FormData,
): FormFromSchema<S> | null {
  const parsed = applySchema(
    schema,
    (key, type) => readFormValue(form, key, type as FormFieldType),
    true,
  );

  return parsed as FormFromSchema<S> | null;
}

function readFormValue(
  form: FormData,
  key: string,
  type: FieldType,
): unknown {
  if (isJsonEncodedArray(type)) return jsonArrayOf(form.get(key));
  if (isListMarker(type)) return form.getAll(key);

  return form.get(key);
}

function isJsonEncodedArray(type: FieldType): boolean {
  return isListMarker(type) && isNestedMarker(type.type);
}

function jsonArrayOf(raw: FormDataEntryValue | null): List<unknown> | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(raw.trim());
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
