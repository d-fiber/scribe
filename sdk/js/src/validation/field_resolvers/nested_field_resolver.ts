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
import type { BodySchema } from "../schema.ts";
import type { FieldResolver } from "./field_resolver.ts";

function _isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The {@link FieldResolver} for a field marked nested: validates `raw` against this resolver's own schema. */
export class NestedFieldResolver implements FieldResolver {
  constructor(private readonly schema: BodySchema) {}

  /**
   * The {@link FieldResolver.resolve} implementation: on a JSON body, `raw` must already be a
   * plain object; on a form, it must be a string that parses to one.
   */
  resolve(raw: unknown, isForm: boolean): unknown {
    if (isForm) return this._resolveFormEncoded(raw);
    return _isPlainObject(raw) ? applyBodySchema(this.schema, raw) : null;
  }

  /** Parses `raw` as the JSON text a form field carries a nested object under, a form having no native way to nest one. */
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
