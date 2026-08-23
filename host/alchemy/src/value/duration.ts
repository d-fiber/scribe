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

import type { Comparable } from "./comparable.ts";

/**
 * How long something lasts.
 *
 * @remarks
 * It is the only way a length of time is written here, so a member that takes one cannot be handed
 * a bare number whose unit nobody agreed on. {@link DateTime} is its counterpart: this says how
 * long, that says when.
 *
 * An instance never changes. {@link add} and {@link subtract} answer another one.
 *
 * @example
 * ```ts
 * const window = Duration.minutes(1);
 * const penalty = window.add(Duration.seconds(30));
 * ```
 */
export class Duration implements Comparable<Duration> {
  /** How long this is, in milliseconds, which every unit below is worked out from. */
  readonly #ms: number;

  /**
   * Builds a length of `ms` milliseconds.
   *
   * It is private so a length is written in the unit it was meant in, through one of the factories
   * below, rather than as a number whose unit is left to whoever reads it.
   */
  private constructor(ms: number) {
    this.#ms = ms;
  }

  /** How long this is, in whole and fractional seconds. */
  get inSeconds(): number {
    return this.#ms / 1_000;
  }

  /** How long this is, in whole and fractional minutes. */
  get inMinutes(): number {
    return this.#ms / 60_000;
  }

  /** How long this is, in whole and fractional hours. */
  get inHours(): number {
    return this.#ms / 3_600_000;
  }

  /** How long this is, in whole and fractional days. */
  get inDays(): number {
    return this.#ms / 86_400_000;
  }

  /** How long this is, in milliseconds, which is what it holds. */
  get inMilliseconds(): number {
    return this.#ms;
  }

  /** This duration and `other` together. */
  add(other: Duration): Duration {
    return new Duration(this.#ms + other.#ms);
  }

  /** This duration less `other`, which may be negative. */
  subtract(other: Duration): Duration {
    return new Duration(this.#ms - other.#ms);
  }

  /**
   * Where this falls against `other`, which is what sorts a list of durations.
   *
   * @returns A negative number when this is shorter, zero when they are the same, a positive number
   * when this is longer.
   */
  compareTo(other: Duration): number {
    return this.inMilliseconds - other.inMilliseconds;
  }

  /**
   * How many milliseconds this is, which is what a comparison between two of these reads.
   *
   * @remarks
   * It answers the unit this holds, as {@link Bytes} and {@link DateTime} do, rather than the
   * seconds it used to: three types of value that each answered a different unit is how a caller
   * ends up comparing one against a number that meant something else.
   *
   * It is here because TypeScript accepts `<` between two objects of the same type and cannot be
   * made to refuse it. Taking this away does not turn `a < b` into an error, it turns it into a
   * comparison of the two printed forms, so `30s < 1min` answers false. Whoever wants equality
   * wants {@link equals}: `===` compares identity and always will.
   */
  valueOf(): number {
    return this.#ms;
  }

  /** Whether `other` is the same length of time as this. */
  equals(other: Duration): boolean {
    return this.#ms === other.#ms;
  }

  /**
   * This length written with the unit it is read in, such as `1.5min` or `250ms`.
   *
   * @remarks
   * It carries the unit because this is what a message and a log line print, and a bare number
   * there is exactly what this type exists to prevent: a duration that reached a reader without
   * saying what it was counted in.
   */
  toString(): string {
    if (this.#ms === 0) return "0s";
    if (Math.abs(this.#ms) < 1000) return `${this.#ms}ms`;
    if (Math.abs(this.#ms) < 60_000) return `${trimmed(this.#ms / 1000)}s`;
    if (Math.abs(this.#ms) < 3_600_000) return `${trimmed(this.#ms / 60_000)}min`;
    if (Math.abs(this.#ms) < 86_400_000) return `${trimmed(this.#ms / 3_600_000)}h`;
    return `${trimmed(this.#ms / 86_400_000)}d`;
  }

  /** A length of `n` seconds. */
  static seconds(n: number): Duration {
    return new Duration(n * 1_000);
  }
  /** A length of `n` minutes. */
  static minutes(n: number): Duration {
    return new Duration(n * 60_000);
  }
  /** A length of `n` hours. */
  static hours(n: number): Duration {
    return new Duration(n * 3_600_000);
  }
  /** A length of `n` days. */
  static days(n: number): Duration {
    return new Duration(n * 86_400_000);
  }
  /** A length of `n` milliseconds, which is what this holds underneath. */
  static milliseconds(n: number): Duration {
    return new Duration(n);
  }
}

/** `value` with a trailing `.0` taken off, so a whole number of units reads as one. */
function trimmed(value: number): string {
  return String(Number(value.toFixed(2)));
}
