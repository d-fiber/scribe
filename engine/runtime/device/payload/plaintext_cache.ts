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

import { TtlLru } from "@scribe/runtime/support/cache/ttl_lru.ts";

const MAX_CACHED_PAYLOADS = 512;

/** What was made of one sealed payload: its plaintext, or the fact that it has none. */
interface Decoded {
  /** The text the box held, or null when it could not be opened. */
  readonly plaintext: string | null;
}

/**
 * What each sealed payload was decoded to, held for as long as it could still be fresh.
 *
 * @remarks
 * Three answers and not two: `undefined` is a payload this process has not seen, `null` is one it
 * has seen and could not open. The second is worth holding, because repeating the same rubbish is
 * otherwise a free way to spend the seventy microseconds an X25519 exchange costs.
 *
 * Eviction is the least recently read entry, not the whole table. Emptying it at the limit made a
 * flood of five hundred distinct payloads throw away every real one at a stroke, and this cache is
 * the only thing standing between a request and that exchange: a caller sending rubbish put every
 * other caller back to full price. The bound still holds, and what a flood costs now is the entries
 * it actually pushed past.
 */
export class PlaintextCache {
  readonly #held: TtlLru<Decoded>;

  constructor(ttlMs: number, limit: number = MAX_CACHED_PAYLOADS, now: () => number = Date.now) {
    this.#held = new TtlLru<Decoded>({ max: limit, ttlMs, now });
  }

  /** What `encrypted` was decoded to, or `undefined` when this process holds no answer for it. */
  lookup(encrypted: string): string | null | undefined {
    return this.#held.get(encrypted)?.plaintext;
  }

  /** Holds what `encrypted` was decoded to, refusal included. */
  remember(encrypted: string, plaintext: string | null): void {
    this.#held.set(encrypted, { plaintext });
  }

  /** How many payloads are held. */
  get size(): number {
    return this.#held.size;
  }
}
