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

import { base64, base64Url, json } from "@scribe/alchemy";

/**
 * The bytes `value` spells, or null when it does not spell any.
 *
 * @remarks
 * The decoding is the vocabulary's, which refuses `+`, `/` and padding rather than reading them as
 * the other alphabet's spelling of the same bytes. That matters here because what arrives is a
 * token: one that has two texts is one a replay guard keyed on the text would hold in one spelling
 * and let through in the other.
 *
 * What this adds is the answer on failure. Everything that reads a token here is deciding whether
 * to refuse a call, not telling whoever wrote the input what is wrong with it, so a refusal reads
 * better as an absent value than as an exception every caller has to catch the same way.
 */
export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    return base64Url.decode(value);
  } catch {
    return null;
  }
}

/**
 * The bytes `value` spells in standard base64, or null when it does not spell any.
 *
 * @remarks
 * It is the padded alphabet with `+` and `/`, which is what a webhook secret and a webhook
 * signature are written in. They are not tokens carried in an address, so the alphabet
 * {@link fromBase64Url} reads would refuse exactly the spelling those arrive in.
 */
export function fromBase64(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    return base64.decode(value);
  } catch {
    return null;
  }
}

/** What `value` spells once decoded and read as JSON, or null when either step fails. */
export function jsonFromBase64Url(value: string): unknown | null {
  const bytes = fromBase64Url(value);
  if (bytes === null) return null;

  try {
    return json.decode(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
