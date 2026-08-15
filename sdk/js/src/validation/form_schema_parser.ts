// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import type { FormFieldCtor, FormSchema } from "./field_types.ts";
import type { FormFromSchema } from "./inference.ts";
import { isArrMarker, isNestedMarker } from "./markers.ts";
import { applySchema, type FieldCtor } from "./schema_application.ts";

export function applyFormSchema<S extends FormSchema>(
  schema: S,
  form: FormData,
): FormFromSchema<S> | null {
  const parsed = applySchema(
    schema,
    (key, ctor) => readFormValue(form, key, ctor as FormFieldCtor),
    true,
  );

  return parsed as FormFromSchema<S> | null;
}

function readFormValue(
  form: FormData,
  key: string,
  ctor: FieldCtor,
): unknown {
  if (isJsonEncodedArray(ctor)) return jsonArrayOf(form.get(key));
  if (isArrMarker(ctor)) return form.getAll(key);

  return form.get(key);
}

function isJsonEncodedArray(ctor: FieldCtor): boolean {
  return isArrMarker(ctor) && isNestedMarker(ctor.ctor);
}

function jsonArrayOf(raw: FormDataEntryValue | null): unknown[] | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(raw.trim());
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
