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

interface TtlLruOptions {
  /** How many entries this cache holds before it drops the least recent one. */
  readonly max: number;

  /** How long an entry stays readable, in milliseconds. */
  readonly ttlMs: number;

  /** The clock this cache ages its entries against. */
  readonly now?: () => number;
}

interface Held<T> {
  readonly value: T;
  readonly expiresAt: number;
}

/**
 * A bounded map that forgets an entry once it is old, or once it is the least
 * recently read of a full cache.
 *
 * There is no eviction pass and no timer: an expired entry is dropped when it
 * is next read, and a full cache drops its oldest on the write that fills it.
 * That keeps the whole cost on the calls themselves, which is what lets this
 * sit in front of a network cache without adding anything of its own.
 *
 * Nothing here is shared between replicas. An entry a process holds survives a
 * deletion made anywhere else, so the ttl is the window a caller accepts being
 * wrong for, not a detail.
 */
export class TtlLru<T> {
  readonly #max: number;
  readonly #ttlMs: number;
  readonly #now: () => number;
  readonly #entries = new Map<string, Held<T>>();

  constructor({ max, ttlMs, now = Date.now }: TtlLruOptions) {
    this.#max = Math.max(1, max);
    this.#ttlMs = ttlMs;
    this.#now = now;
  }

  /** How many entries are held, expired ones included. */
  get size(): number {
    return this.#entries.size;
  }

  /** The value held for `key`, or `null` when there is none left to read. */
  get(key: string): T | null {
    const held = this.#entries.get(key);
    if (held === undefined) return null;

    if (held.expiresAt <= this.#now()) {
      this.#entries.delete(key);
      return null;
    }

    this.#entries.delete(key);
    this.#entries.set(key, held);
    return held.value;
  }

  /** Holds `value` under `key`, dropping the least recent entry if it has to. */
  set(key: string, value: T): void {
    this.#entries.delete(key);
    this.#entries.set(key, { value, expiresAt: this.#now() + this.#ttlMs });

    if (this.#entries.size <= this.#max) return;

    const oldest = this.#entries.keys().next();
    if (!oldest.done) this.#entries.delete(oldest.value);
  }

  /** Forgets everything, which is what a caller does when it cannot say what changed. */
  clear(): void {
    this.#entries.clear();
  }
}
