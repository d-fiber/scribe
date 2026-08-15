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

import { applyBodySchema } from "@scribe/core/kernel/validation/body_schema_parser.ts";
import { applyFormSchema } from "@scribe/core/kernel/validation/form_schema_parser.ts";
import type {
  BodyFromSchema,
  BodySchema,
  FormFromSchema,
  FormSchema,
} from "@scribe/core/kernel/validation/schema.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

export function parseBody<S extends BodySchema>(
  schema: S,
): BodyFromSchema<S> | null {
  const bytes = request.bytes();
  if (!bytes) return null;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    return applyBodySchema(schema, parsed as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function parseForm<S extends FormSchema>(
  schema: S,
): Promise<FormFromSchema<S> | null> {
  try {
    const bytes = RequestScope.getBodyBytes();
    if (!bytes || bytes.byteLength === 0) return null;

    const contentType = request.header("content-type") ?? "";
    const tmp = new Response(bytes as BodyInit, {
      headers: { "content-type": contentType },
    });
    return applyFormSchema(schema, await tmp.formData());
  } catch {
    return null;
  }
}
