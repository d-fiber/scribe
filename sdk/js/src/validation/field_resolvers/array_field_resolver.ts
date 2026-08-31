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

/** The {@link FieldResolver} for a field marked as an array: resolves `raw` element by element. */
export class ArrayFieldResolver implements FieldResolver {
  constructor(private readonly itemCtor: ArrayItemCtor) {}

  /**
   * The {@link FieldResolver.resolve} implementation: `null` unless `raw` is an array, each element
   * resolved in turn.
   *
   * @remarks
   * The three item kinds disagree on what one bad element does to the rest of the array. A file
   * array drops whatever is not a `File` and keeps the rest, since a form can legitimately submit a
   * mix of files and empty slots. A scalar array keeps its length, an element that failed to coerce
   * becomes `null` in place rather than being dropped or refusing the field. A nested object array
   * refuses the whole field the moment one element fails its own schema: `applyBodySchema` has no
   * way to hand back a partially valid record, so there is nothing short of `null` it could put in
   * that slot.
   */
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
