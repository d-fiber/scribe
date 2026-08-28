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

import { applyBodySchema } from "../body.ts";
import type { BodySchema } from "../../field_types.ts";
import type { FieldResolver } from "./resolver.ts";

/** Whether `value` is an object written with fields, rather than a list or nothing at all. */
function _isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a field holding a shape of its own, by reading that shape the way the outer one is read.
 *
 * @remarks
 * The mandatory fields of the inner shape are checked there, so an inner one missing makes the
 * whole field answer null, and the outer shape then decides what that means where it sits.
 */
export class NestedFieldResolver implements FieldResolver {
  /**
   * Builds a resolver for a field declared to hold `schema`.
   *
   * @param schema - The inner shape, read exactly as an outer one is.
   */
  constructor(private readonly schema: BodySchema) {}

  /** What `raw` holds once read as the inner shape, or null when it does not hold it. */
  resolve(raw: unknown, isForm: boolean): unknown {
    if (isForm) return this._resolveFormEncoded(raw);
    return _isPlainObject(raw) ? applyBodySchema(this.schema, raw) : null;
  }

  /**
   * Reads an inner shape out of the text a form carried it in.
   *
   * @remarks
   * A form has no way to nest, so the only way to send an inner shape through one is to write it
   * as JSON in a single field. Text that is not JSON answers null rather than raising, because a
   * body somebody wrote badly is a body to refuse and not a fault in this code.
   */
  private _resolveFormEncoded(raw: unknown): unknown {
    const jsonText = typeof raw === "string" ? raw.trim() : "";
    if (!jsonText) return null;

    try {
      const parsed: unknown = JSON.parse(jsonText);
      return _isPlainObject(parsed) ? applyBodySchema(this.schema, parsed) : null;
    } catch {
      return null;
    }
  }
}
