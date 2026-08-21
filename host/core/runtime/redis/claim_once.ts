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
import { kv } from "@scribe/foundation/lib/src/redis/mod.ts";

/** What a claim does when Redis cannot answer. */
export type WhenUnavailable = "allow" | "refuse";

/**
 * Claims `key` for `ttlSeconds`, and answers whether this caller is the first to do so.
 *
 * It is the short form of a distributed lock: there is nothing to release, because the point
 * is that the second caller loses for as long as the key lives. A nonce, a webhook delivery
 * id and an idempotency key are all the same question asked of different keys.
 *
 * `whenUnavailable` is not a default anyone should inherit. A replay index that fails open
 * lets a replayed request through, and a nonce that fails closed locks out every device the
 * moment Redis blinks — the two callers want opposite things, and each has to say which.
 */
export async function claimOnce(
  key: string,
  ttlSeconds: number,
  { whenUnavailable, scope }: { whenUnavailable: WhenUnavailable; scope: string },
): Promise<boolean> {
  try {
    return (await kv().set(key, "1", "EX", ttlSeconds, "NX")) === "OK";
  } catch (error) {
    console.error(`[${scope}] claim store unavailable:`, error);
    return whenUnavailable === "allow";
  }
}
