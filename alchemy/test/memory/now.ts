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

import type { NowSource } from "../../value/date_time.ts";
import type { Duration } from "../../value/duration.ts";

/**
 * A source of time that stands still until the case moves it.
 *
 * @remarks
 * It is what a test puts in `Now` so that nothing it measures depends on when it runs. Time passes
 * only where the case says it does, which is what lets a case about an hour take no time at all.
 *
 * @example
 * ```ts ignore
 * const now = new FixedNow(DateTime.parse("2026-01-01T00:00:00Z").millisecondsSinceEpoch);
 * Now.use(now);
 *
 * const hold = subject.place(basket);
 * now.pass(Duration.hours(2));
 * assertEquals(subject.stillHeld(hold), false);
 * ```
 */
export class FixedNow implements NowSource {
  /** The instant this reads, in milliseconds since the epoch. */
  #at: number;

  /**
   * Builds a source reading `at` until something moves it.
   *
   * @param at - The instant this reads until it is moved, in milliseconds since the epoch. It is
   * the epoch itself when left out, which is rarely what a case wants to read in a message.
   */
  constructor(at = 0) {
    this.#at = at;
  }

  /** The instant this holds, which never moves on its own. */
  millisecondsSinceEpoch(): number {
    return this.#at;
  }

  /** Moves this forward by `by`, so everything asked afterwards reads later. */
  pass(by: Duration): void {
    this.#at += by.inMilliseconds;
  }

  /** Sets this to the instant `at` names, in milliseconds since the epoch. */
  set(at: number): void {
    this.#at = at;
  }
}
