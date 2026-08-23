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
import type { RateLimiter, RateLimiterDriver, RateLimitOptions, RateLimitOutcome } from "../../port/rate_limit.ts";
import { Now } from "../../value/date_time.ts";

/** What one caller has spent, and until when it is held out. */
interface Spent {
  /** How many calls have been counted inside the window that is open. */
  count: number;

  /** When the window that is open started. */
  since: number;

  /** How many times this caller has gone over, which is what makes the penalty grow. */
  strikes: number;

  /** When the caller may try again, or null when it is not held out. */
  until: number | null;
}

/**
 * A limiter that counts in a map, for a test to run a package against.
 *
 * @remarks
 * It reads the clock through {@link Now}, so a case freezes it, spends a quota, moves the clock past
 * the window and sees the count start again, without waiting for a window to actually turn. That is
 * the whole reason to have one: a limit is a statement about time, and a test that waits for time is
 * a test nobody runs.
 *
 * The penalty grows the way the port describes: a caller that goes over is held out for `penalty`,
 * and going over again doubles it, up to `maxPenalty`.
 */
export class MemoryRateLimiter implements RateLimiter {
  /** What each caller has spent, by the name the check was made under. */
  readonly #spent = new Map<string, Spent>();

  /** What this limiter was opened with. */
  readonly #options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.#options = options;
  }

  check(prefix = "", suffix = ""): Future<RateLimitOutcome> {
    const at = Now.get().millisecondsSinceEpoch();
    const held = this.#of(prefix, suffix, at);

    if (held.until !== null && at < held.until) {
      return Promise.resolve({ ok: false, retryAfter: Math.ceil((held.until - at) / 1000), strikes: held.strikes });
    }

    held.until = null;
    held.count++;

    if (held.count <= this.#options.limit) {
      return Promise.resolve({ ok: true, remaining: this.#options.limit - held.count });
    }

    held.strikes++;
    const doubled = this.#options.penalty.inMilliseconds * Math.pow(2, held.strikes - 1);
    const capped = this.#options.maxPenalty === undefined
      ? doubled
      : Math.min(doubled, this.#options.maxPenalty.inMilliseconds);
    held.until = at + capped;

    return Promise.resolve({ ok: false, retryAfter: Math.ceil(capped / 1000), strikes: held.strikes });
  }

  isBlocked(prefix = "", suffix = ""): Future<boolean> {
    const at = Now.get().millisecondsSinceEpoch();
    const held = this.#spent.get(`${prefix}:${suffix}`);
    return Promise.resolve(held !== undefined && held.until !== null && at < held.until);
  }

  unmeasured(): RateLimitOutcome {
    return { ok: true, remaining: this.#options.limit };
  }

  /** What `prefix` and `suffix` have spent, with the window started again when it has turned. */
  #of(prefix: string, suffix: string, at: number): Spent {
    const name = `${prefix}:${suffix}`;
    const held = this.#spent.get(name);

    if (held === undefined) {
      const fresh: Spent = { count: 0, since: at, strikes: 0, until: null };
      this.#spent.set(name, fresh);
      return fresh;
    }

    if (at - held.since >= this.#options.window.inMilliseconds) {
      held.count = 0;
      held.since = at;
    }
    return held;
  }
}

/** A driver that opens a {@link MemoryRateLimiter} per key, for a test to fill `RateLimiters` with. */
export class MemoryRateLimiters implements RateLimiterDriver {
  /** Every limiter opened so far, by the key it was opened under. */
  readonly opened: Map<string, MemoryRateLimiter> = new Map<string, MemoryRateLimiter>();

  open(options: RateLimitOptions): RateLimiter {
    const already = this.opened.get(options.key);
    if (already !== undefined) return already;

    const held = new MemoryRateLimiter(options);
    this.opened.set(options.key, held);
    return held;
  }
}
