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

import type { Future } from "./future.ts";

/**
 * Gives back the place an {@link Semaphore.acquire} took.
 *
 * @remarks
 * Calling it twice gives back one place, not two. A place can therefore only be given back by
 * whoever took it, which is what a bare `release` method could never be made to check: a counter
 * cannot tell a second release from a first one while somebody else holds a place.
 */
export type Release = () => void;

/**
 * Lets through as many callers at once as it was given, and queues the rest.
 *
 * @remarks
 * It counts places rather than owning what runs, so what it guards is decided entirely by who calls
 * it. {@link run} is the form to prefer: it takes the place, calls, and gives the place back in a
 * `finally`, so a call that fails does not leak one.
 *
 * {@link acquire} answers the place rather than a method giving it back, so a place can only be
 * given back by whoever took it. A bare `release` cannot be made safe: while somebody holds a
 * place, a counter has no way of telling a stray call from a paired one, and the stray one used to
 * hand a queued caller a place that had never been taken.
 *
 * The queue is served in the order it was joined, and nothing here times out. A caller that waits
 * forever is waiting on the places never coming back, which is a caller that forgot to release.
 *
 * @example
 * ```ts ignore
 * const writes = new Semaphore(4);
 * await Future.wait(rows.map((row) => writes.run(() => store.put(row))));
 * ```
 */
export class Semaphore {
  /** How many callers may hold a place at once, never under one. */
  readonly #limit: number;

  /** Whoever is queued, in the order they joined, each waiting to be handed a place. */
  readonly #waiting: Array<() => void> = [];

  /** How many places are taken right now. */
  #inFlight = 0;

  /**
   * Builds a semaphore letting `limit` callers through at once.
   *
   * @param limit - How many places there are. Anything under one is read as one, since a semaphore
   * that lets nobody through is a deadlock rather than a setting.
   */
  constructor(limit: number) {
    this.#limit = Math.max(1, limit);
  }

  /** How many callers hold a place right now. */
  get inFlight(): number {
    return this.#inFlight;
  }

  /** How many callers are queued for a place. */
  get waiting(): number {
    return this.#waiting.length;
  }

  /**
   * Takes a place, waiting for one when they are all taken.
   *
   * @returns What to call to give the place back. {@link run} is the form to prefer, which calls it
   * in a `finally` rather than leaving it to be remembered.
   */
  acquire(): Future<Release> {
    if (this.#inFlight < this.#limit) {
      this.#inFlight++;
      return Promise.resolve(this.#placeBack());
    }
    return new Promise<Release>((taken) => this.#waiting.push(() => taken(this.#placeBack())));
  }

  /** A {@link Release} that gives one place back however many times it is called. */
  #placeBack(): Release {
    let given = false;
    return () => {
      if (given) return;
      given = true;
      this.#handOver();
    };
  }

  /**
   * Passes the place on, or lowers the count when nobody is queued.
   *
   * @remarks
   * The place goes straight to whoever has waited longest rather than being freed for them to race
   * over, so while callers are queued the place changes hands and the count never dips.
   */
  #handOver(): void {
    const next = this.#waiting.shift();
    if (next) next();
    else this.#inFlight--;
  }

  /**
   * Waits for a place, runs `call`, and gives the place back however it ends.
   *
   * @returns What `call` answered, and it raises what `call` raised.
   */
  async run<R>(call: () => Future<R>): Future<R> {
    const release = await this.acquire();
    try {
      return await call();
    } finally {
      release();
    }
  }
}
