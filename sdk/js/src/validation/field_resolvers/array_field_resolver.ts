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

import { applyBodySchema } from "../body_schema_parser.ts";
import type { BodySchema, NestedMarker, ScalarCtor } from "../schema.ts";
import type { FieldResolver } from "./field_resolver.ts";
import { ScalarFieldResolver } from "./scalar_field_resolver.ts";

type ArrayItemCtor =
  | ScalarCtor
  | typeof File
  | NestedMarker<BodySchema>
  | BodySchema;

function _isNestedMarker(
  ctor: ArrayItemCtor,
): ctor is NestedMarker<BodySchema> {
  return typeof ctor === "object" && ctor !== null && "_nested" in ctor;
}

export class ArrayFieldResolver implements FieldResolver {
  constructor(private readonly itemCtor: ArrayItemCtor) {}

  resolve(raw: unknown, isForm: boolean): unknown {
    if (!Array.isArray(raw)) return null;

    if (this.itemCtor === File) {
      return raw.filter((item) => item instanceof File);
    }
    if (_isNestedMarker(this.itemCtor)) {
      return this._resolveObjectItems(raw, this.itemCtor.schema);
    }
    if (typeof this.itemCtor === "function") {
      const scalar = new ScalarFieldResolver(this.itemCtor);
      return raw.map((item) => scalar.resolve(item, isForm));
    }
    return this._resolveObjectItems(raw, this.itemCtor);
  }

  private _resolveObjectItems(
    items: unknown[],
    schema: BodySchema,
  ): unknown[] | null {
    const results: unknown[] = [];
    for (const item of items) {
      if (typeof item !== "object" || item === null || Array.isArray(item)) {
        return null;
      }
      const parsed = applyBodySchema(schema, item as Record<string, unknown>);
      if (parsed === null) return null;
      results.push(parsed);
    }
    return results;
  }
}
