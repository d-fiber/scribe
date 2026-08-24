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
 * A sequence of values that arrive over time.
 *
 * @remarks
 * It is what a body being read, a query answering row by row, or a subscription hands back. A
 * caller walks it with `for await`, and what it costs to hold is one value rather than all of them,
 * which is the whole reason to answer one instead of a list.
 */
export type Stream<T> = AsyncIterable<T>;

/**
 * A value somebody else settles.
 *
 * @remarks
 * It is what bridges an interface built on callbacks to one built on futures: hand out
 * {@link Completer.future}, and settle it from the callback when it fires. Settling twice does
 * nothing, so a callback that fires again cannot undo what the first one answered.
 */
export class Completer<T> {
  /** What {@link future} hands out, built once when this completer is. */
  readonly #future: Future<T>;

  /** What settles {@link future}, kept from where it was built so it can be called later. */
  #settle!: (value: T) => void;

  /** What fails {@link future}, kept from where it was built so it can be called later. */
  #fail!: (raised: unknown) => void;

  /** Whether this completer has already been settled, one way or the other. */
  #done = false;

  /** Builds a completer whose future is waiting on somebody to settle it. */
  constructor() {
    this.#future = new Promise<T>((settle, fail) => {
      this.#settle = settle;
      this.#fail = fail;
    });
  }

  /** What the caller waits on. It is the same one every time it is read. */
  get future(): Future<T> {
    return this.#future;
  }

  /** Whether this has already been settled, one way or the other. */
  get isCompleted(): boolean {
    return this.#done;
  }

  /** Settles with `value`, and does nothing when this was settled already. */
  complete(value: T): void {
    if (this.#done) return;
    this.#done = true;
    this.#settle(value);
  }

  /** Settles with a failure, and does nothing when this was settled already. */
  completeError(raised: unknown): void {
    if (this.#done) return;
    this.#done = true;
    this.#fail(raised);
  }
}
