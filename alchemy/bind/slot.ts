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

import { ScribeError } from "../error/scribe_error.ts";

/**
 * A place that was read before anything filled it.
 *
 * @remarks
 * It descends from {@link ScribeError} because it is a fault in wiring rather than in this code:
 * somebody has to fill the slot, and the message says which one and what to call. Answering null
 * instead would turn a wiring mistake into a null that travels, and the fault would surface three
 * calls later as an access on undefined that names nothing.
 */
export class BindingError extends ScribeError {}

/**
 * A place the host fills and a package reads.
 *
 * @remarks
 * It is the shape every capability of the repo takes: a package writes against an interface, and
 * what implements it arrives from outside. That is what lets `Caches` hold a real broker in
 * production and a map in a test, without the package that uses it knowing either exists.
 *
 * A slot is filled once at boot, before anything reads it, and read every time from then on.
 * Reading one nobody filled refuses rather than answering nothing, so a wiring mistake surfaces
 * where it happened and names what to call.
 *
 * It holds a value and not a factory: what fills it decides how it is built, and the slot only
 * remembers.
 *
 * @example
 * ```ts
 * export const Caches: Slot<CacheDriver> = new Slot<CacheDriver>("Caches");
 *
 * Caches.use(new RedisCaches(url));
 * ```
 */
export class Slot<T> {
  /** What this slot is called, which is what its refusal names so a reader knows what to fill. */
  readonly #name: string;

  /** What was put in, or null while nothing has been. */
  #value: T | null = null;

  /**
   * Opens a slot called `name`.
   *
   * @param name - What to call in order to fill it, written exactly as the export is, since that
   * is what the refusal quotes back.
   */
  constructor(name: string) {
    this.#name = name;
  }

  /**
   * Puts `value` in, replacing whatever was there.
   *
   * It does not refuse a second call: a test that fills a slot the host already filled is doing
   * what it means to, and there is nothing the slot could tell the two apart by.
   */
  use(value: T): void {
    this.#value = value;
  }

  /**
   * Empties this slot, so reading it throws again.
   *
   * @remarks
   * It exists for a test that filled a slot the host had not filled, and has to leave the process
   * as it found it. Putting a value back is {@link use}; there is no value that means empty, which
   * is why emptying is a call of its own.
   */
  clear(): void {
    this.#value = null;
  }

  /**
   * What was put in.
   *
   * @throws {BindingError} When nothing has been put in yet.
   */
  get(): T {
    if (this.#value === null) {
      throw new BindingError(
        `"${this.#name}" was never given a value. Something has to call ${this.#name}.use(...) before anything reads it.`,
      );
    }
    return this.#value;
  }

  /**
   * Whether anything has been put in.
   *
   * It is for whatever wires the process and needs to know what is left to fill. Reading it as a
   * guard before {@link get} is not what it is for: a slot that should be filled and is not is a
   * refusal worth raising, not a branch worth taking.
   */
  get configured(): boolean {
    return this.#value !== null;
  }
}
