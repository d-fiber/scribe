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

import { MAX_BODY_BYTES, MAX_FORM_BYTES } from "@scribe/core/runtime/http/limits.ts";
import { httpSettings } from "@scribe/core/runtime/support/settings/http.ts";

let inflightBytes = 0;

export interface BodyAdmission {
  readonly reservedBytes: number;
  readonly maxBodyBytes: number;

  /**
   * The size this request declared, or `null` when it declared nothing usable.
   *
   * The reader uses it to allocate the destination once instead of collecting
   * chunks and copying them into a second buffer of the same size.
   */
  readonly declaredBytes: number | null;
}

/**
 * Reserves room for this request's body, or `null` when the process is full.
 *
 * A refusal is a 503, not a rejection of the request itself: the caller may
 * retry once other bodies have been released.
 *
 * The budget covers every body, not only uploads: a small body admitted for
 * free is still a buffer the process has to keep until the handler answers,
 * and thousands of them at 64 KiB apiece take the process past its container
 * long before any single upload does.
 */
export function admitBody(req: Request): BodyAdmission | null {
  const ceiling = isMultipart(req) ? MAX_FORM_BYTES : MAX_BODY_BYTES;
  const declared = declaredSize(req, ceiling);
  const size = declared ?? ceiling;

  if (inflightBytes + size > httpSettings.get().maxInflightBodyBytes) {
    return null;
  }

  inflightBytes += size;
  return { reservedBytes: size, maxBodyBytes: size, declaredBytes: declared };
}

export function releaseBody(admission: BodyAdmission): void {
  inflightBytes -= admission.reservedBytes;
}

export function inflightBodyBytes(): number {
  return inflightBytes;
}

function isMultipart(req: Request): boolean {
  return req.headers
    .get("content-type")
    ?.toLowerCase()
    .includes("multipart/form-data") ?? false;
}

/**
 * What this request says it will send, or `null` when it says nothing usable.
 *
 * A declared size doubles as the read bound, so a content-length that lies low
 * cannot buy a small reservation and then send more than it reserved.
 */
function declaredSize(req: Request, ceiling: number): number | null {
  const declared = Number(req.headers.get("content-length") ?? 0);

  return Number.isFinite(declared) && declared > 0 && declared <= ceiling
    ? declared
    : null;
}
