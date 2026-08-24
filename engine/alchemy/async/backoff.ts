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

import { Duration } from "../value/duration.ts";

/**
 * How long to wait before trying again, doubling each time up to a ceiling.
 *
 * @remarks
 * It answers a length and does nothing else: it neither waits nor retries, so what calls it decides
 * when to give up and what counts as worth retrying. That is what keeps it usable both by something
 * that retries a request and by something that reschedules a queue message.
 *
 * An instance never changes, and the same attempt always answers the same length. Nothing here
 * spreads the waits apart, so several callers backing off together stay together.
 *
 * @example
 * ```ts
 * const backoff = new ExponentialBackoff(Duration.milliseconds(200), Duration.seconds(30));
 * await Future.delayed(backoff.delayFor(attempt));
 * ```
 */
export class ExponentialBackoff {
  /** How long to wait before the second attempt, and what every later one is worked out from. */
  readonly #base: Duration;

  /** The longest this ever answers, which the base itself is held under. */
  readonly #ceiling: Duration;

  /** What the wait is multiplied by at each attempt. */
  readonly #factor: number;

  /**
   * Builds a backoff that starts at `base` and never answers more than `ceiling`.
   *
   * @param base - How long to wait before the second attempt.
   * @param ceiling - The longest this ever answers, however many attempts have passed.
   * @param factor - What the wait is multiplied by at each attempt. Two unless said otherwise.
   */
  constructor(base: Duration, ceiling: Duration, factor = 2) {
    this.#base = base;
    this.#ceiling = ceiling;
    this.#factor = factor;
  }

  /**
   * How long to wait before `attempt`.
   *
   * @param attempt - Which try this is, counting from one. Zero and negatives are treated as the
   * first, so a caller that counts from zero is not punished for it.
   */
  delayFor(attempt: number): Duration {
    const ceiling = this.#ceiling.inMilliseconds;
    if (attempt <= 1) return Duration.milliseconds(Math.min(this.#base.inMilliseconds, ceiling));
    return Duration.milliseconds(
      Math.min(this.#base.inMilliseconds * this.#factor ** (attempt - 1), ceiling),
    );
  }
}
