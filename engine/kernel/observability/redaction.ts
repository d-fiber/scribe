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

import { json } from "@scribe/alchemy";

const SENSITIVE_WORDS: ReadonlySet<string> = new Set([
  "auth",
  "authorization",
  "bearer",
  "cookie",
  "credential",
  "credentials",
  "jwt",
  "key",
  "keys",
  "otp",
  "passcode",
  "passwd",
  "password",
  "pin",
  "secret",
  "signature",
  "token",
  "tokens",
]);

const WORD_BOUNDARY = /[^A-Za-z0-9]+|(?<=[a-z0-9])(?=[A-Z])/;
const REDACTED = "[redacted]";

/**
 * How deep the walk goes before it stops describing and starts summarising.
 *
 * @remarks
 * It is not a taste: the walk is recursive, and a body nested past the stack threw a `RangeError`
 * that the caller caught by handing on the **unredacted** text. A secret at any depth therefore
 * left the machine in the clear, and the deeper the body the surer it was to. No error body
 * carries meaning this far down, so what is past it is named rather than walked.
 */
const MAX_DEPTH = 64;

/** What stands in for a subtree the walk refused to go into. */
const TOO_DEEP = "[too deep]";

export function isSensitiveKey(key: string): boolean {
  return key
    .split(WORD_BOUNDARY)
    .some((word) => SENSITIVE_WORDS.has(word.toLowerCase()));
}

/**
 * `value` with everything a sensitive name covers replaced, and nothing walked past {@link MAX_DEPTH}.
 *
 * @param depth - How far down this call already is. Callers leave it out.
 */
export function redactSensitive(value: unknown, depth: number = 0): unknown {
  if (depth >= MAX_DEPTH) return TOO_DEEP;

  if (Array.isArray(value)) return value.map((entry) => redactSensitive(entry, depth + 1));

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(val, depth + 1);
    }
    return out;
  }

  return value;
}

/** What is handed on in place of a body that parsed as JSON and could not be walked. */
const UNWALKABLE = "[unredacted json withheld]";

/**
 * `text` with its secrets replaced when it is JSON, and unchanged when it is not.
 *
 * @remarks
 * The two failures are not the same and used to answer alike. Text that is not JSON is handed on
 * as it stands, which is the point: a plain error message is worth reading. Text that **is** JSON
 * and could not be walked is withheld, because handing it on is handing on exactly the secrets
 * this function was called to remove.
 *
 * Nothing reaches that second answer today: what comes out of a parse is a plain tree, the depth
 * bound keeps the walk off the stack, and a bounded plain tree always encodes. It stands so that a
 * change to the walk cannot put an unredacted body back on the wire the way the missing bound
 * did, and no test covers it because no input reaches it.
 */
export function redactIfJson(text: string): string {
  let parsed: unknown;
  try {
    parsed = json.decode(text);
  } catch {
    return text;
  }

  try {
    return json.encode(redactSensitive(parsed));
  } catch {
    return UNWALKABLE;
  }
}
