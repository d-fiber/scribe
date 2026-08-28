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

import type { List } from "../../../../value/list.ts";
import { applyBodySchema } from "../body.ts";
import type { BodySchema, PrimitiveType } from "../../field_types.ts";
import type { NestedMarker } from "../../markers.ts";
import type { FieldResolver } from "./resolver.ts";
import { PrimitiveFieldResolver } from "./primitive.ts";

/** Everything a list may be declared to hold, one item at a time. */
type ListItemType =
  | PrimitiveType
  | typeof File
  | NestedMarker<BodySchema>
  | BodySchema;

/** Whether `type` is a shape wrapped in a marker rather than one written bare. */
function _isNestedMarker(
  type: ListItemType,
): type is NestedMarker<BodySchema> {
  return typeof type === "object" && type !== null && "_nested" in type;
}

/**
 * Reads a field holding several values, each of them read the way one would be.
 *
 * @remarks
 * Anything that is not a list answers null rather than a list of one. A caller that meant to send
 * one value and sent it bare wrote a different body from the one the shape asked for, and guessing
 * which they meant is how a shape stops describing anything.
 */
export class ListFieldResolver implements FieldResolver {
  /**
   * Builds a resolver for a list whose items were declared as `itemType`.
   *
   * @param itemType - What one item is, which is what decides how each of them is read.
   */
  constructor(private readonly itemType: ListItemType) {}

  /**
   * What `raw` holds once every item has been read as `itemType` asked.
   *
   * @remarks
   * A list of files keeps only what is a file, since a form that sent a field twice with one
   * empty part arrives as a list holding an empty string. That is the one exception, and it is
   * written here rather than left to be discovered.
   *
   * Everything else answers null the moment one item does not hold, because half a list is a body
   * nobody asked for. Reading item by item and keeping what came back used to leave a null sitting
   * inside a list the compiler had promised held numbers, so a caller added it up and got a total
   * that was quietly wrong.
   */
  resolve(raw: unknown, isForm: boolean): unknown {
    if (!Array.isArray(raw)) return null;

    if (this.itemType === File) {
      return raw.filter((item) => item instanceof File);
    }
    if (_isNestedMarker(this.itemType)) {
      return this._resolveObjectItems(raw, this.itemType.schema);
    }
    if (typeof this.itemType === "function") {
      const scalar = new PrimitiveFieldResolver(this.itemType);
      const read: unknown[] = [];
      for (const item of raw) {
        const value = scalar.resolve(item, isForm);
        if (value === null) return null;
        read.push(value);
      }
      return read;
    }
    return this._resolveObjectItems(raw, this.itemType);
  }

  /**
   * Reads every one of `items` against `schema`, or answers null as soon as one does not hold.
   *
   * @remarks
   * It is written apart because a nested shape is reached two ways, wrapped in a marker or written
   * bare, and both arrive here.
   */
  private _resolveObjectItems(
    items: List<unknown>,
    schema: BodySchema,
  ): List<unknown> | null {
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
