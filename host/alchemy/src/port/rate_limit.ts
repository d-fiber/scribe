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

/** What opening a rate limit takes. */
export interface RateLimitOptions {
  /** The prefix every counter of this limit carries, which is what keeps two limits apart. */
  readonly key: string;

  /** How many calls are allowed within {@link window}. */
  readonly limit: number;

  /** The stretch of time the calls are counted over. */
  readonly window: Time;

  /** How long a caller that went over is refused for. */
  readonly penalty: Time;

  /** The longest a penalty may grow to when a caller keeps going over. Unbounded when left out. */
  readonly maxPenalty?: Time;

  /** How long a strike is remembered, which is what makes a penalty grow. */
  readonly strikeMemory?: Time;

  /**
   * Whether a caller is let through when the counter cannot be reached.
   *
   * @remarks
   * Refusing everybody because the counter is down turns one outage into two. Letting everybody
   * through drops the limit exactly when it may be needed. There is no right answer, which is why
   * whoever declares the limit chooses.
   */
  readonly failOpen?: boolean;
}

/** What a rate limit answers about one call. */
export type RateLimitOutcome =
  | {
    /** The call is allowed. */
    readonly ok: true;

    /** How many calls are left in the current window. */
    readonly remaining: number;
  }
  | {
    /** The call is refused. */
    readonly ok: false;

    /** How many seconds before the caller may try again. */
    readonly retryAfter: number;

    /** How many times this caller has gone over while its strikes were remembered. */
    readonly strikes: number;
  };

/**
 * A count of what one caller is allowed to do, and the refusal when it goes over.
 *
 * @remarks
 * A package never reaches a counter. It asks {@link RateLimiters} to open a limit, and talks to
 * this. Asking costs a call: a refused caller spends a token, which is the half of the trade that
 * makes a flood of invalid attempts cost the caller rather than the host.
 */
export interface RateLimiter {
  /**
   * Counts one call from the caller `prefix` and `suffix` name, and says whether it is allowed.
   *
   * @param prefix - What the caller is grouped by, an endpoint or a tenant. Empty for none.
   * @param suffix - What names the caller within that group, usually a hash of an identifier.
   */
  check(prefix?: string, suffix?: string): Promise<RateLimitOutcome>;

  /** Whether that caller is currently refused, without counting a call. */
  isBlocked(prefix?: string, suffix?: string): Promise<boolean>;

  /** The outcome to answer when a call was not counted at all, so a caller is never told it went over. */
  unmeasured(): RateLimitOutcome;
}

/** What opens a rate limit. */
export interface RateLimiterDriver {
  /** Opens the limit `options` describes. */
  open(options: RateLimitOptions): RateLimiter;
}

/**
 * What answers a package that needs to hold a caller to a quota.
 *
 * @remarks
 * The host fills this once, at boot. A package reads it and never names an implementation.
 */
export const RateLimiters: Slot<RateLimiterDriver> = new Slot<RateLimiterDriver>("RateLimiters");

/**
 * A rate limit that opens itself the first time it is used, and not before.
 *
 * @remarks
 * A limit is declared at module scope, which runs at import, and nothing has filled
 * {@link RateLimiters} at that point. Declaring touches nothing; the slot is read at the first
 * call.
 */
class DeferredRateLimiter implements RateLimiter {
  readonly #options: RateLimitOptions;
  #opened: RateLimiter | null = null;

  constructor(options: RateLimitOptions) {
    this.#options = options;
  }

  check(prefix?: string, suffix?: string): Promise<RateLimitOutcome> {
    return this.#limit().check(prefix, suffix);
  }

  isBlocked(prefix?: string, suffix?: string): Promise<boolean> {
    return this.#limit().isBlocked(prefix, suffix);
  }

  unmeasured(): RateLimitOutcome {
    return this.#limit().unmeasured();
  }

  #limit(): RateLimiter {
    return this.#opened ??= RateLimiters.get().open(this.#options);
  }
}

/**
 * Declares the rate limit `options` describes, without opening it.
 *
 * @remarks
 * This is what a package writes, at module scope. Nothing is reached until the first call.
 */
export function rateLimit(options: RateLimitOptions): RateLimiter {
  return new DeferredRateLimiter(options);
}
