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

import type { Future } from "@scribe/alchemy";

/**
 * Reads the whole request body, or `null` once it grows past `maxBytes`.
 *
 * Pass `declaredBytes` when the request announced a content-length: the
 * destination is then allocated once and written through, instead of holding
 * every chunk and copying them into a second buffer of the same size. That
 * second buffer doubles the peak cost of every request that has one.
 *
 * @param declaredBytes - The announced size, which must not be smaller than
 * what the body turns out to be. A body that overruns it is refused the same
 * way as one that overruns `maxBytes`.
 */
export async function readBoundedBody(
  req: Request,
  maxBytes: number,
  declaredBytes: number | null = null,
): Future<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0);

  const bound = declaredBytes === null ? maxBytes : Math.min(declaredBytes, maxBytes);
  const reader = req.body.getReader();
  const preallocated = declaredBytes === null ? null : new Uint8Array(bound);
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (total + value.byteLength > bound) {
        await reader.cancel().catch(() => {});
        return null;
      }

      if (preallocated !== null) preallocated.set(value, total);
      else chunks.push(value);

      total += value.byteLength;
    }
  } catch (error) {
    console.error("[serve] could not read the request body:", error);
    return new Uint8Array(0);
  }

  return preallocated !== null ? preallocated.subarray(0, total) : joined(chunks, total);
}

function joined(chunks: readonly Uint8Array[], total: number): Uint8Array {
  const bytes = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}
