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

import type { List, UnmodifiableList } from "../../value/list.ts";

/** The brand that separates a matcher from an ordinary argument of the same shape. */
const MATCHER = Symbol.for("scribe.alchemy.matcher");

/**
 * Something written in an argument position that decides which calls a stub or a check is about.
 *
 * @remarks
 * A matcher is only ever built inside the function handed to `when` or `verify`, and it is read
 * while that function runs. Nothing holds one between two statements, so a matcher cannot reach a
 * real call, and there is no state left open for the next stub to inherit.
 */
export interface ArgumentMatcher {
  /** The brand, which is how {@link isMatcher} tells one from a plain object. */
  readonly [MATCHER]: true;

  /** How this matcher reads in a refusal, such as `anything` or `matching(row.id !== "")`. */
  readonly described: string;

  /** Whether `value` is one of the arguments this matcher stands for. */
  matches(value: unknown): boolean;

  /**
   * Keeps `value` when this matcher captures, and does nothing when it does not.
   *
   * It is called only once the whole call matched, so a capture never collects the arguments of a
   * call that was rejected on another argument. Both a declared answer and a check hand it what
   * they matched, so a capture written in either place collects.
   */
  keep(value: unknown): void;

  /** Drops everything this matcher kept, which is what lets one check follow another. */
  forget(): void;
}

/** Whether `value` was written by one of the matcher functions rather than passed as an argument. */
export function isMatcher(value: unknown): value is ArgumentMatcher {
  return typeof value === "object" && value !== null && MATCHER in value;
}

/** What a capture hands back, and the only matcher that keeps what it saw. */
export interface Capture<T> {
  /**
   * The matcher itself, written where the argument goes.
   *
   * It types as `T` so the call reads like a real one, and it is the same object every time it is
   * read, so a capture used twice in one call collects both positions.
   */
  readonly arg: T;

  /** What every matched call carried in that position, in the order the calls were made. */
  readonly values: UnmodifiableList<T>;
}

class Matcher implements ArgumentMatcher {
  readonly [MATCHER] = true as const;
  readonly described: string;
  readonly #decide: (value: unknown) => boolean;
  readonly #kept: List<unknown> | null;

  constructor(
    described: string,
    decide: (value: unknown) => boolean,
    kept: List<unknown> | null,
  ) {
    this.described = described;
    this.#decide = decide;
    this.#kept = kept;
  }

  matches(value: unknown): boolean {
    return this.#decide(value);
  }

  keep(value: unknown): void {
    this.#kept?.push(value);
  }

  forget(): void {
    this.#kept?.splice(0, this.#kept.length);
  }
}

/**
 * Stands for any argument in that position.
 *
 * @example
 * ```ts ignore
 * when(() => clock.tick(anything<number>())).thenReturn(noon);
 * ```
 */
export function anything<T>(): T {
  return new Matcher("anything", () => true, null) as T;
}

/**
 * Stands for an argument `predicate` accepts.
 *
 * @param predicate - What the argument has to satisfy. It is called with whatever was passed, so it
 * has to survive a value of another shape when the same member is called two ways.
 * @param described - How it reads in a refusal. Left out, the refusal says `matching(...)`, which
 * names the position without saying what was expected of it.
 */
export function matching<T>(
  predicate: (value: T) => boolean,
  described?: string,
): T {
  return new Matcher(
    described ?? "matching(...)",
    (value) => predicate(value as T),
    null,
  ) as T;
}

/**
 * Stands for any argument in that position, and keeps what each matched call carried there.
 *
 * @remarks
 * A check clears what it kept before it counts, so two checks written one after the other each
 * answer for themselves rather than the second seeing the first one's arguments too.
 *
 * @example
 * ```ts ignore
 * const written = capture<Row>();
 * verify(() => store.put(written.arg)).twice();
 * assertEquals(written.values.map((row) => row.id), ["ada", "grace"]);
 * ```
 */
export function capture<T>(): Capture<T> {
  const kept: unknown[] = [];
  const matcher = new Matcher("capture", () => true, kept);

  return {
    arg: matcher as T,
    get values(): UnmodifiableList<T> {
      return kept as List<T>;
    },
  };
}
