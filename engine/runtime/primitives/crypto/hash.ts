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

import { hex, utf8 } from "@scribe/alchemy";
import type { Future } from "@scribe/alchemy";

/**
 * `bytes` written as lower case hexadecimal, two characters per byte.
 *
 * @remarks
 * It takes a buffer as well as a view, because what `crypto.subtle.digest` answers is a buffer and
 * every caller here comes from one. The codec of `@scribe/alchemy` is declared over views alone.
 */
export function toHex(bytes: ArrayBuffer | Uint8Array): string {
  return hex.encode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

/**
 * The bytes `encoded` spells.
 *
 * @throws {FormatException} When `encoded` is not lower case hexadecimal.
 */
export const fromHex = hex.decode;

/**
 * The SHA-256 of `input`, written as lower case hexadecimal.
 *
 * @remarks
 * It lives here and not in `@scribe/alchemy` because it reaches `crypto.subtle`, and nothing
 * published as the vocabulary a package writes against is allowed to reach anything that runs.
 * A package that needs a digest asks the framework for one.
 *
 * @param input - What to digest, as text or as bytes.
 */
export async function sha256Hex(input: string | Uint8Array): Future<string> {
  const bytes = typeof input === "string" ? utf8.encode(input) : input;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);

  return hex.encode(new Uint8Array(digest));
}
