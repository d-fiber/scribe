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

import { Slot } from "../bind/slot.ts";

/**
 * A value that follows the asynchronous call tree, held for whoever is under the call that set it.
 *
 * @remarks
 * It is what a caller reaches for instead of threading a parameter through every function between
 * where a value is known and where it is needed. A request identity, the client an exchange goes
 * out on, the trace a log line belongs to: each is set once, around a body, and read anywhere
 * inside it.
 *
 * The substitution follows what the body awaits and nothing else, so two flows running at once
 * each see their own, and nothing outside the body sees either.
 */
export interface CurrentStore<T> {
  /** Runs `body` with `value` held, and answers what `body` answered. */
  run<R>(value: T, body: () => R): R;

  /** What is held for the caller, or null when nothing set one. */
  get(): T | null;
}

/** What makes a store, which is the one thing this repository cannot do for itself. */
export interface CurrentDriver {
  /**
   * Opens a store under `name`.
   *
   * @param name - What the store is called, used in whatever a driver reports. Two calls with the
   * same name answer two stores rather than the same one: a store's identity is the object, not
   * its name.
   */
  open<T>(name: string): CurrentStore<T>;
}

/**
 * What answers a package that needs a value to follow its calls.
 *
 * @remarks
 * Carrying a value along an asynchronous call tree cannot be done without the platform: it takes
 * something like an async context, and nothing here reaches the platform. So the shape is here and
 * the mechanism is filled from outside, exactly as a cache or a client is.
 */
export const Currents: Slot<CurrentDriver> = new Slot<CurrentDriver>("Currents");

/**
 * A place a value is set around a body and read under it.
 *
 * @remarks
 * Declaring one touches nothing. It is written at module scope, which runs the moment somebody
 * imports the module, and at that point nothing has filled {@link Currents} yet. The store is
 * opened at the first call and not before.
 *
 * @example
 * ```ts ignore
 * const currentCaller = new Current<Identity>("caller");
 *
 * currentCaller.run(identity, async () => {
 *   await handle(request);
 * });
 *
 * // anywhere under that body
 * const who = currentCaller.get();
 * ```
 */
export class Current<T> implements CurrentStore<T> {
  /** What this place is called, which is what the store is opened under. */
  readonly #name: string;

  /** The store this stands in for, opened at the first call and kept from then on. */
  #store: CurrentStore<T> | null = null;

  /**
   * Declares a place called `name`.
   *
   * @param name - What a driver reports this under. Two places declared with the same name are
   * still two places: what identifies one is the object, not the name.
   */
  constructor(name: string) {
    this.#name = name;
  }

  /** What this place is called, which is what a driver reports it under. */
  get name(): string {
    return this.#name;
  }

  /**
   * Sets `value` for the length of `body`, and answers what `body` answered.
   *
   * Anything called under it reads `value`, however deep and across as many awaits as it likes.
   * Outside it, this place answers whatever it held before, which is usually nothing.
   */
  run<R>(value: T, body: () => R): R {
    return this.#opened().run(value, body);
  }

  /** What is held for the caller, or null when nothing above them set one. */
  get(): T | null {
    return this.#opened().get();
  }

  /**
   * The store, opening it the first time it is wanted.
   *
   * Declaring touches nothing, so the slot cannot be read where the place is declared: that runs at
   * import, before the host has filled anything.
   */
  #opened(): CurrentStore<T> {
    if (this.#store === null) this.#store = Currents.get().open<T>(this.#name);
    return this.#store;
  }
}
