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

import type { Time } from "../value/time.ts";
import { Slot } from "../bind/slot.ts";

/** What opening a cache takes. */
export interface CacheOptions {
  /** The prefix every key of this cache carries, which is what keeps two caches apart. */
  readonly key: string;

  /** How long an entry stays before it is forgotten. It stays until it is deleted when left out. */
  readonly ttl?: Time;

  /**
   * How eagerly an entry is recomputed before it expires, as a multiplier on its remaining life.
   *
   * Left out, an entry is recomputed when it is asked for after expiring, which lets several
   * callers compute the same value at once.
   */
  readonly beta?: number;
}

/**
 * A store of values held under a name, forgotten after a while.
 *
 * @remarks
 * A package never reaches a cache server. It asks {@link Caches} to open one, and talks to this.
 * What is behind it is the host's business, and a test puts something else there.
 */
export interface Cache<T> {
  /** What is held under `id`, or null when nothing is. */
  get(id: string): Promise<T | null>;

  /** What is held under each of `ids`, in the same order, with null where nothing is. */
  getMany(ids: readonly string[]): Promise<(T | null)[]>;

  /** Holds `value` under `id`, over whatever was there. */
  add(id: string, value: T): Promise<void>;

  /** Holds each value under its identifier, over whatever was there. */
  addMany(entries: readonly [string, T][]): Promise<void>;

  /** Forgets what is held under `id`, and does nothing when nothing is. */
  delete(id: string): Promise<void>;

  /** Forgets what is held under each identifier. */
  deleteMany(...ids: string[]): Promise<void>;

  /**
   * What is held under `id`, computing and holding it when nothing is.
   *
   * @remarks
   * The whole point of asking for it this way is that the computation runs once even when several
   * callers ask at the same time. Doing it by hand with {@link get} and {@link add} does not.
   */
  upsert(id: string, compute: () => Promise<T>): Promise<T>;

  /** Forgets everything this cache holds, or everything whose identifier matches `pattern`. */
  clear(pattern?: string): Promise<void>;
}

/** What opens a cache. */
export interface CacheDriver {
  /** Opens the cache `options` describes. Opening it twice with the same key answers the same store. */
  open<T>(options: CacheOptions): Cache<T>;
}

/**
 * What answers a package that needs a cache.
 *
 * @remarks
 * The host fills this once, at boot, with whatever it runs against. A package reads it and never
 * names an implementation, which is what lets it be written without the framework and tested
 * without anything up.
 */
export const Caches: Slot<CacheDriver> = new Slot<CacheDriver>("Caches");

/**
 * A cache that opens itself the first time it is used, and not before.
 *
 * @remarks
 * This is the whole reason a package does not write `Caches.get().open(...)` itself. A cache is
 * declared at module scope, which is evaluated the moment the module is imported, and at that
 * point nothing has filled {@link Caches} yet. Reading the slot there would throw before the host
 * has had a chance to start.
 *
 * Declaring touches nothing. The slot is read at the first call, by which time the host is up.
 */
class DeferredCache<T> implements Cache<T> {
  readonly #options: CacheOptions;
  #opened: Cache<T> | null = null;

  constructor(options: CacheOptions) {
    this.#options = options;
  }

  get(id: string): Promise<T | null> {
    return this.#store().get(id);
  }

  getMany(ids: readonly string[]): Promise<(T | null)[]> {
    return this.#store().getMany(ids);
  }

  add(id: string, value: T): Promise<void> {
    return this.#store().add(id, value);
  }

  addMany(entries: readonly [string, T][]): Promise<void> {
    return this.#store().addMany(entries);
  }

  delete(id: string): Promise<void> {
    return this.#store().delete(id);
  }

  deleteMany(...ids: string[]): Promise<void> {
    return this.#store().deleteMany(...ids);
  }

  upsert(id: string, compute: () => Promise<T>): Promise<T> {
    return this.#store().upsert(id, compute);
  }

  clear(pattern?: string): Promise<void> {
    return this.#store().clear(pattern);
  }

  #store(): Cache<T> {
    return this.#opened ??= Caches.get().open<T>(this.#options);
  }
}

/**
 * Declares the cache `options` describes, without opening it.
 *
 * @remarks
 * This is what a package writes, at module scope, next to the code that uses it. Nothing is
 * reached until the first call, so importing the package before the host is up is safe.
 *
 * @example
 * ```ts
 * const members = cache<CachedMembership>({ key: "audience:member", ttl: Time.days(7) });
 * ```
 */
export function cache<T>(options: CacheOptions): Cache<T> {
  return new DeferredCache<T>(options);
}
