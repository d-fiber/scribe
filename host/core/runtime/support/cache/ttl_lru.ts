// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
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
