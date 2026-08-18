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

import { kv } from "@scribe/foundation/src/redis/mod.ts";

/**
 * A Redis set that names the cache entries belonging to one subject.
 *
 * It exists because `clear(pattern)` walks the whole keyspace whatever the pattern, so a cache
 * that has to drop everything held for one user reads the set instead of scanning. Every
 * operation is fail-soft: an index that cannot answer costs a stale entry, and no caller of a
 * cache should fail because its bookkeeping did.
 *
 * The expiry is re-armed on every write, so the index never outlives the entries it points at
 * — an index key written without one would stay behind forever.
 */
export class KeyIndex {
  readonly #prefix: string;
  readonly #ttlSeconds: number;
  readonly #scope: string;

  constructor(prefix: string, ttlSeconds: number, scope: string) {
    this.#prefix = prefix;
    this.#ttlSeconds = ttlSeconds;
    this.#scope = scope;
  }

  /** The key this index lives under for `subject`. */
  keyOf(subject: string): string {
    return `${this.#prefix}:${subject}`;
  }

  /** Adds `entry` to the index of `subject`, and re-arms the expiry. */
  async remember(subject: string, entry: string): Promise<boolean> {
    try {
      const key = this.keyOf(subject);
      await kv().sadd(key, entry);
      await kv().expire(key, this.#ttlSeconds);
      return true;
    } catch (e) {
      console.error(`[${this.#scope}] index failed:`, e);
      return false;
    }
  }

  /** Everything indexed for `subject`, or nothing when the index cannot answer. */
  async members(subject: string): Promise<string[]> {
    try {
      return await kv().smembers(this.keyOf(subject));
    } catch (e) {
      console.error(`[${this.#scope}] index read failed:`, e);
      return [];
    }
  }

  /** Drops the index of `subject`, leaving what it pointed at to its own expiry. */
  async forget(subject: string): Promise<void> {
    try {
      await kv().del(this.keyOf(subject));
    } catch (e) {
      console.error(`[${this.#scope}] index clear failed:`, e);
    }
  }
}
