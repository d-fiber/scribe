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
import { redactIfJson } from "./redaction.ts";

const PREVIEW_BYTES_THRESHOLD = 8_192;
const PREVIEW_CHARS_THRESHOLD = 500;
const PREVIEW_EDGE_CHARS = 250;

/**
 * What a failed response said, short enough to travel with its entry.
 *
 * Empty under 400, and that is what keeps this off the hot path: reading it
 * means cloning the response and reading the whole body, which is not worth
 * doing on a paginated list that went fine.
 *
 * It is redacted before it leaves this function rather than before it is
 * printed. A preview no longer stops at a terminal an operator is watching --
 * it reaches the project's sink, which may well post it to a collector, so a
 * token left in it would leave the machine.
 */
export async function previewOf(response: Response): Future<string> {
  if (response.status < 400) return "";

  const declaredBytes = Number(response.headers.get("content-length") ?? 0);
  if (declaredBytes > PREVIEW_BYTES_THRESHOLD) return `[${declaredBytes} bytes]`;

  const head = await firstBytes(response, PREVIEW_BYTES_THRESHOLD);
  if (head === null) return `[over ${PREVIEW_BYTES_THRESHOLD} bytes]`;

  const text = redactIfJson(head);
  return text.length > PREVIEW_CHARS_THRESHOLD ? elided(text) : text;
}

/**
 * The whole body as text, or `null` once it goes past `maxBytes`.
 *
 * @remarks
 * A `content-length` is what bounds this everywhere it exists, and a chunked answer has none: an
 * error page streamed by an upstream is then read whole into a string, on the request path, only
 * to be cut to five hundred characters afterwards. Reading through the stream stops at the bound
 * instead, and a body that goes past it is named by its size rather than by its contents, because
 * a prefix cut mid-object is not JSON and would travel to the sink unredacted.
 */
async function firstBytes(response: Response, maxBytes: number): Future<string | null> {
  const body = response.clone().body;
  if (body === null) return "";

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;
      if (total > maxBytes) return null;

      chunks.push(value);
    }
  } finally {
    // Not awaited: `clone` tees, and a tee's cancel only settles once *both* branches cancel, so
    // waiting here would hang on a response the caller has not read yet. Cancelling this branch
    // is still what keeps the tee from queueing the rest of the body for a reader that is gone.
    reader.cancel().catch(() => {});
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

function elided(text: string): string {
  const head = text.slice(0, PREVIEW_EDGE_CHARS);
  const tail = text.slice(-PREVIEW_EDGE_CHARS);
  return `${head}...${tail}`;
}
