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
import { Slot } from "../bind/slot.ts";
import { describeText, FormatException } from "../error/format_exception.ts";
import { Duration } from "./duration.ts";

/** What answers the question of what time it is. */
export interface NowSource {
  /** How many milliseconds have passed since the first instant of 1970, in UTC. */
  millisecondsSinceEpoch(): number;
}

/**
 * What {@link DateTime.now} reads.
 *
 * @remarks
 * Reading the time is reaching the platform, and nothing here reaches the platform, so the host
 * fills this once with something that does. A test fills it with something that stands still, which
 * is what makes a case about an hour passing take no time at all.
 */
export const Now: Slot<NowSource> = new Slot<NowSource>("Now");

/** How many milliseconds each unit holds, for the arithmetic below. */
const SECOND = 1_000;

/**
 * A point in time, told in milliseconds since the first instant of 1970.
 *
 * @remarks
 * It is what {@link Duration} is not: a duration says how long, this says when. The two go
 * together, and every method that mixes them takes or answers a `Duration`.
 *
 * An instance never changes. {@link add} and {@link subtract} answer another one, so a value handed
 * to somebody else cannot be moved under them.
 *
 * @example
 * ```ts ignore
 * const startedAt = DateTime.now();
 * const deadline = startedAt.add(Duration.minutes(5));
 * if (DateTime.now().isAfter(deadline)) throw Refusal.conflict("the hold has run out.");
 * ```
 */
export class DateTime implements Comparable<DateTime> {
  /** How many milliseconds have passed since the first instant of 1970, in UTC. */
  readonly millisecondsSinceEpoch: number;

  /**
   * Builds an instant from milliseconds since the epoch.
   *
   * It is private so an instant comes from one of the named ways of getting one, each of which says
   * where it came from: the clock, a text, or a number somebody already had.
   */
  private constructor(millisecondsSinceEpoch: number) {
    this.millisecondsSinceEpoch = millisecondsSinceEpoch;
  }

  /**
   * The instant this is being asked.
   *
   * It reads {@link Now}, so it refuses until something has filled it. That is deliberate: a
   * process that never said where its time comes from has not been wired, and answering the
   * platform's clock anyway would hide it.
   */
  static now(): DateTime {
    return new DateTime(Now.get().millisecondsSinceEpoch());
  }

  /** The instant `millisecondsSinceEpoch` names. */
  static fromMillisecondsSinceEpoch(millisecondsSinceEpoch: number): DateTime {
    return new DateTime(millisecondsSinceEpoch);
  }

  /** The instant the first day of 1970 opened on, which is what every count here is measured from. */
  static get epoch(): DateTime {
    return new DateTime(0);
  }

  /**
   * The instant `text` spells, which has to be a full date and time.
   *
   * @throws {FormatException} When `text` names no instant.
   */
  static parse(text: string): DateTime {
    const at = Date.parse(text);
    if (Number.isNaN(at)) throw new FormatException(`Expected a date and a time. ${describeText(text.length, null)}`);
    return new DateTime(at);
  }

  /**
   * Where this falls against `other`, which is what sorts a list of instants.
   *
   * @returns A negative number when this comes first, zero when they are the same instant, a
   * positive number when `other` comes first.
   */
  compareTo(other: DateTime): number {
    return this.millisecondsSinceEpoch - other.millisecondsSinceEpoch;
  }

  /** How many seconds have passed since the first instant of 1970, whole and fractional. */
  get secondsSinceEpoch(): number {
    return this.millisecondsSinceEpoch / SECOND;
  }

  /** This instant, `by` later. */
  add(by: Duration): DateTime {
    return new DateTime(this.millisecondsSinceEpoch + by.inMilliseconds);
  }

  /** This instant, `by` earlier. */
  subtract(by: Duration): DateTime {
    return new DateTime(this.millisecondsSinceEpoch - by.inMilliseconds);
  }

  /** How long from `other` to this one. It is negative when `other` comes after. */
  difference(other: DateTime): Duration {
    return Duration.milliseconds(this.millisecondsSinceEpoch - other.millisecondsSinceEpoch);
  }

  /** Whether this instant comes before `other`. */
  isBefore(other: DateTime): boolean {
    return this.millisecondsSinceEpoch < other.millisecondsSinceEpoch;
  }

  /** Whether this instant comes after `other`. */
  isAfter(other: DateTime): boolean {
    return this.millisecondsSinceEpoch > other.millisecondsSinceEpoch;
  }

  /** Whether this instant and `other` are the same one. */
  isAtSameMomentAs(other: DateTime): boolean {
    return this.millisecondsSinceEpoch === other.millisecondsSinceEpoch;
  }

  /** This instant written the way a machine reads it, in UTC. */
  toIso8601String(): string {
    return new Date(this.millisecondsSinceEpoch).toISOString();
  }

  /** This instant written the one way it is ever written, as ISO 8601 in UTC. */
  toString(): string {
    return this.toIso8601String();
  }

  /**
   * This instant as milliseconds since the epoch, which is what comparing two of these reads.
   *
   * @remarks
   * It is here because TypeScript accepts `<` between two objects of the same type and cannot be
   * made to refuse it. Whoever wants equality wants {@link equals}.
   */
  valueOf(): number {
    return this.millisecondsSinceEpoch;
  }

  /** Whether `other` names the same instant as this. */
  equals(other: DateTime): boolean {
    return this.millisecondsSinceEpoch === other.millisecondsSinceEpoch;
  }
}
