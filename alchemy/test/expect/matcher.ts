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

import { equal } from "./equal.ts";
import { difference, format } from "./error.ts";

/** What a constructor looks like when all that matters is what it builds. */
// deno-lint-ignore no-explicit-any -- a constructor's parameters are contravariant, so unknown[] rejects one with typed arguments.
type Constructor<T> = abstract new (...args: any[]) => T;

/**
 * What a value is held against.
 *
 * @remarks
 * A matcher answers two things: whether the value passes, and what to say when it does not. The
 * second is why this is an object rather than a predicate. A boolean tells the reader of a failing
 * suite that something was false, and nothing else; a matcher says what was expected and what was
 * there, which is the whole of what somebody needs at that moment.
 */
export interface Matcher<T> {
  /**
   * Never read, and never given a value.
   *
   * @remarks
   * It is what makes a matcher refuse a value of another type. Without it `T` appears in no member,
   * so `Matcher<string>` and `Matcher<number>` are the same type to a structural compiler and
   * `expect(3, equals("hello"))` compiles: a test that cannot pass, written in the one place a
   * suite is supposed to be checked from.
   *
   * It is written as a method rather than a field on purpose. A method takes its parameter both
   * ways round, so a matcher goes wherever its type is related to what is being held: `equals(null)`
   * holds a `string | null` and {@link isNull} holds anything at all, which is most of what a suite
   * asserts. Two unrelated types are still refused, and that is the whole of what this is for.
   */
  expects?(value: T): void;

  /** What this matcher expected, said as a fragment: `equals 3`, `is null`, `contains "ada"`. */
  readonly described: string;

  /** Whether `actual` is what this matcher was looking for. */
  matches(actual: unknown): boolean;

  /**
   * What to say about `actual` beyond the description, or null when the description says it all.
   *
   * {@link equals} uses it to name the first field that differs rather than printing two whole
   * structures, which is the part a reader is looking for and the slow part to find by eye.
   */
  mismatch(actual: unknown): string | null;
}

/** Builds a matcher from the two things every one of them answers. */
function matcher<T>(
  described: string,
  matches: (actual: unknown) => boolean,
  mismatch: (actual: unknown) => string | null = () => null,
): Matcher<T> {
  return { described, matches, mismatch };
}

/**
 * Holds against `expected`, all the way down.
 *
 * @remarks
 * Sameness is what {@link equal} decides, so `NaN` equals itself, `+0` does not equal `-0`, and an
 * instance never equals a plain object carrying the same fields.
 */
export function equals<T>(expected: T): Matcher<T> {
  return matcher(
    `equals ${format(expected)}`,
    (actual) => equal(actual, expected),
    (actual) => difference(expected, actual),
  );
}

/** Holds against `expected` itself, compared with `Object.is`. */
export function same<T>(expected: T): Matcher<T> {
  return matcher(`is ${format(expected)} itself`, (actual) => Object.is(actual, expected));
}

/** Holds when what it is given does not hold against `inner`. */
export function isNot<T>(inner: Matcher<T>): Matcher<T> {
  return matcher(
    `is not ${inner.described.replace(/^(equals|is|contains) /, "$1 ")}`,
    (actual) => !inner.matches(actual),
  );
}

/**
 * Holds when what it is given holds against every one of `inners`.
 *
 * @remarks
 * It is for the check that is two things at once, such as a raise that is of a kind and carries a
 * message: `throwsA(allOf(isA(TypeError), withMessage("declared twice")))`. The mismatch names the
 * first of `inners` that failed, since that is the one a reader is looking for.
 */
export function allOf<T>(...inners: Matcher<T>[]): Matcher<T> {
  return matcher(
    inners.map((inner) => inner.described).join(" and "),
    (actual) => inners.every((inner) => inner.matches(actual)),
    (actual) => inners.find((inner) => !inner.matches(actual))?.mismatch(actual) ?? null,
  );
}

/**
 * Holds on true, and on nothing else.
 *
 * It is written as holding anything, like {@link isNull}, because "and on nothing else" is the
 * whole of what it says: handing it a value that is not a boolean is a question it answers rather
 * than one it refuses.
 */
export const isTrue: Matcher<unknown> = matcher("is true", (actual) => actual === true);

/** Holds on false, and on nothing else, whatever it is handed. */
export const isFalse: Matcher<unknown> = matcher("is false", (actual) => actual === false);

/** Holds on null and on undefined, which are the two absences the platform has. */
export const isNull: Matcher<unknown> = matcher("is null", (actual) => actual === null || actual === undefined);

/** Holds on anything that is neither null nor undefined. */
export const isNotNull: Matcher<unknown> = matcher(
  "is not null",
  (actual) => actual !== null && actual !== undefined,
);

/** Holds on a string, a list or a collection carrying nothing. */
export const isEmpty: Matcher<unknown> = matcher("is empty", (actual) => lengthOf(actual) === 0);

/** Holds on a string, a list or a collection carrying something. */
export const isNotEmpty: Matcher<unknown> = matcher("is not empty", (actual) => {
  const held = lengthOf(actual);
  return held !== null && held > 0;
});

/** Holds when what it is given was built by `expected`. */
export function isA<T>(expected: Constructor<T>): Matcher<T> {
  return matcher(`is a ${expected.name}`, (actual) => actual instanceof expected);
}

/** Holds when a string carries `expected` inside it, or a list holds it. */
export function contains<T>(expected: T): Matcher<unknown> {
  return matcher(`contains ${format(expected)}`, (actual) => {
    if (typeof actual === "string") return actual.includes(String(expected));
    if (Array.isArray(actual)) return actual.some((held) => equal(held, expected));
    if (actual instanceof Set || actual instanceof Map) return actual.has(expected as never);
    return false;
  });
}

/** Holds when what it is given carries exactly `expected` things. */
export function hasLength(expected: number): Matcher<unknown> {
  return matcher(
    `has length ${expected}`,
    (actual) => lengthOf(actual) === expected,
    (actual) => {
      const held = lengthOf(actual);
      return held === null ? "it carries nothing that can be counted" : `it has length ${held}`;
    },
  );
}

/** Holds when what it is given is greater than `expected`. */
export function greaterThan<T>(expected: T): Matcher<T> {
  return matcher(`is greater than ${format(expected)}`, (actual) => (actual as T) > expected);
}

/** Holds when what it is given is less than `expected`. */
export function lessThan<T>(expected: T): Matcher<T> {
  return matcher(`is less than ${format(expected)}`, (actual) => (actual as T) < expected);
}

/**
 * Holds when calling what it is given raises something matching `inner`.
 *
 * @remarks
 * It is handed a function rather than a value, because a value has already been computed and
 * whatever it was going to raise has already been raised somewhere else.
 *
 * Answering nothing is a failure like any other: a call that was meant to refuse and returned
 * instead is exactly what this is written to catch.
 *
 * It is written as holding a call that answers `never`, which is what lets it be handed a call
 * answering anything at all: a matcher goes where a wider one is expected, and nothing is wider
 * than what never returns.
 */
export function throwsA<T>(inner: Matcher<T>): Matcher<() => never> {
  return matcher(
    `throws something that ${inner.described}`,
    (actual) => {
      try {
        (actual as () => unknown)();
        return false;
      } catch (raised) {
        return inner.matches(raised);
      }
    },
    (actual) => {
      try {
        (actual as () => unknown)();
        return "it returned instead";
      } catch (raised) {
        return `it threw ${format(raised)}`;
      }
    },
  );
}

/** Holds when what it is given carries a message with `expected` in it. */
export function withMessage(expected: string): Matcher<unknown> {
  return matcher(
    `carries a message with ${format(expected)} in it`,
    (actual) => actual instanceof Error && actual.message.includes(expected),
    (actual) => (actual instanceof Error ? `its message reads ${format(actual.message)}` : null),
  );
}

/**
 * Narrows `inner` to what `extract` pulls out of the value.
 *
 * @remarks
 * It is what lets a check reach inside what was raised without catching it by hand: the value is
 * held against `inner` first, and then the part `extract` names is held against `expected`. The
 * name is what the failure calls that part, since a function has none.
 *
 * @example
 * ```ts ignore
 * expect(
 *   () => hex.decode("zz"),
 *   throwsA(having(isA(FormatException), (raised) => raised.source, "source", equals("zz"))),
 * );
 * ```
 */
export function having<T>(
  inner: Matcher<T>,
  extract: (value: T) => unknown,
  name: string,
  expected: Matcher<unknown>,
): Matcher<T> {
  return matcher(
    `${inner.described} with ${name} that ${expected.described}`,
    (actual) => inner.matches(actual) && expected.matches(extract(actual as T)),
    (actual) => {
      if (!inner.matches(actual)) return inner.mismatch(actual);
      return `  its ${name} is ${format(extract(actual as T))}`;
    },
  );
}

/** How many things `held` carries, or null when it carries nothing countable. */
function lengthOf(held: unknown): number | null {
  if (typeof held === "string" || Array.isArray(held)) return held.length;
  if (held instanceof Set || held instanceof Map) return held.size;
  return null;
}
