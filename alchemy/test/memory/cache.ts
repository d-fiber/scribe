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

import type { Future } from "../../async/future.ts";
import type { List, UnmodifiableList } from "../../value/list.ts";
import type { Cache, CacheDriver, CacheOptions } from "../../port/cache.ts";
import { Now } from "../../value/date_time.ts";

/** One entry of a {@link MemoryCache}, with when it stops counting. */
interface Held<T> {
  /** What was put in. */
  readonly value: T;

  /** When it is forgotten, or null when it is held until it is deleted. */
  readonly until: number | null;
}

/**
 * A cache that keeps what it is given in a map, for a test to run a package against.
 *
 * @remarks
 * It honours the two things the port promises and a hand-written double usually does not. Time-to
 * live is read against {@link Now}, so a case that freezes the clock and moves it forward sees an
 * entry expire without waiting for one. And {@link upsert} runs its computation once even when
 * several callers ask at the same time, which is the only reason that member exists: a fake that
 * ran it once per caller let a package ship a stampede its suite said could not happen.
 */
export class MemoryCache<T> implements Cache<T> {
  /** What is held, by identifier. */
  readonly #held = new Map<string, Held<T>>();

  /** A computation already running for an identifier, so a second caller waits on the first. */
  readonly #computing = new Map<string, Future<T>>();

  /** The prefix and the lifetime this cache was opened with. */
  readonly #options: CacheOptions;

  /** How many times a computation handed to {@link upsert} has actually been run. */
  computed = 0;

  constructor(options: CacheOptions) {
    this.#options = options;
  }

  /** The {@link Cache.get} implementation: reads `id`, forgetting it first if its lifetime has run out. */
  get(id: string): Future<T | null> {
    return Promise.resolve(this.#read(id));
  }

  /** The {@link Cache.getMany} implementation: `get` applied to each of `ids`, in order. */
  getMany(ids: UnmodifiableList<string>): Future<(T | null)[]> {
    return Promise.resolve(ids.map((id) => this.#read(id)));
  }

  /** The {@link Cache.add} implementation: stores `value` under `id`, timed by this cache's own `ttl`. */
  add(id: string, value: T): Future<void> {
    this.#held.set(id, { value, until: this.#expiry() });
    return Promise.resolve();
  }

  /** The {@link Cache.addMany} implementation: `add` applied to each of `entries`. */
  addMany(entries: readonly [string, T][]): Future<void> {
    for (const [id, value] of entries) this.#held.set(id, { value, until: this.#expiry() });
    return Promise.resolve();
  }

  /** The {@link Cache.delete} implementation: forgets `id`, whether or not it was held. */
  delete(id: string): Future<void> {
    this.#held.delete(id);
    return Promise.resolve();
  }

  /** The {@link Cache.deleteMany} implementation: `delete` applied to each of `ids`. */
  deleteMany(...ids: List<string>): Future<void> {
    for (const id of ids) this.#held.delete(id);
    return Promise.resolve();
  }

  /**
   * The {@link Cache.upsert} implementation: answers the held value when there is one, otherwise
   * joins an already-running computation for `id` or starts one, so `compute` never runs twice for
   * callers that ask at the same time.
   */
  upsert(id: string, compute: () => Future<T>): Future<T> {
    const already = this.#read(id);
    if (already !== null) return Promise.resolve(already);

    const running = this.#computing.get(id);
    if (running !== undefined) return running;

    const started = (async () => {
      this.computed++;
      const value = await compute();
      this.#held.set(id, { value, until: this.#expiry() });
      return value;
    })().finally(() => {
      this.#computing.delete(id);
    });

    this.#computing.set(id, started);
    return started;
  }

  /**
   * The {@link Cache.clear} implementation: empties the whole cache when `pattern` is left out,
   * otherwise forgets only the identifiers `matcherFor(pattern)` accepts.
   */
  clear(pattern?: string): Future<void> {
    if (pattern === undefined) {
      this.#held.clear();
      return Promise.resolve();
    }

    const matches = matcherFor(pattern);
    for (const id of [...this.#held.keys()]) {
      if (matches(id)) this.#held.delete(id);
    }
    return Promise.resolve();
  }

  /** How many entries are held right now, expired ones included. */
  get size(): number {
    return this.#held.size;
  }

  /** What is held under `id`, forgetting it first when its lifetime has run out. */
  #read(id: string): T | null {
    const held = this.#held.get(id);
    if (held === undefined) return null;

    if (held.until !== null && Now.get().millisecondsSinceEpoch() >= held.until) {
      this.#held.delete(id);
      return null;
    }
    return held.value;
  }

  /** When an entry written now stops counting, or null when this cache holds until deleted. */
  #expiry(): number | null {
    const ttl = this.#options.ttl;
    return ttl === undefined ? null : Now.get().millisecondsSinceEpoch() + ttl.inMilliseconds;
  }
}

/**
 * A driver that opens a {@link MemoryCache} per key, for a test to fill {@link Caches} with.
 *
 * @remarks
 * Opening the same key twice answers the same cache, which is what the port promises and what lets
 * a case check that two declarations of one key share what they hold.
 */
export class MemoryCaches implements CacheDriver {
  /** Every cache opened so far, by the key it was opened under. */
  readonly opened: Map<string, MemoryCache<never>> = new Map<string, MemoryCache<never>>();

  /**
   * The {@link CacheDriver.open} implementation: opens a {@link MemoryCache} for `options.key`,
   * or hands back the one already opened under that key.
   */
  open<T>(options: CacheOptions): Cache<T> {
    const already = this.opened.get(options.key);
    if (already !== undefined) return already as unknown as Cache<T>;

    const held = new MemoryCache<T>(options);
    this.opened.set(options.key, held as unknown as MemoryCache<never>);
    return held;
  }
}

/** Whether an identifier is one `pattern` names, where `*` stands for any run of characters. */
function matcherFor(pattern: string): (id: string) => boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  const shape = new RegExp(`^${escaped}$`);
  return (id) => shape.test(id);
}
