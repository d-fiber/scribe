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
import { AssertionError, format } from "./error.ts";
import type { Matcher } from "./matcher.ts";

/**
 * Refuses unless `actual` holds against `matcher`.
 *
 * @remarks
 * One way in, and the matcher says what is being asked. That is what separates this from a
 * function per question: a new thing to check is a new matcher, written where it is needed, and
 * every one of them reports the same way.
 *
 * @param actual - What was produced.
 * @param matcher - What it was meant to be.
 * @param reason - What this call is about, when several in one case would otherwise read alike. It
 * is the first thing shown when the check fails.
 *
 * @throws {AssertionError} When `actual` does not hold.
 *
 * @example
 * ```ts ignore
 * expect(found, equals(["audience", "realtime"]));
 * expect(page.hasMore, isTrue, "a page with a row to spare says there is nothing after it");
 * expect(() => registry.declare(name, second), throwsA(isA(DuplicateDeclarationError)));
 * ```
 */
export function expect<T>(actual: T, matcher: Matcher<NoInfer<T>>, reason: string | null = null): void {
  if (matcher.matches(actual)) return;
  throw new AssertionError(sentence(actual, matcher, reason));
}

/**
 * Refuses unless what `actual` settles to holds against `matcher`.
 *
 * @remarks
 * It is what {@link expect} is for a value that is not there yet. A function that answers a future
 * is handed over rather than the future itself when the matcher is about what it raises, because a
 * future already rejected has nothing left to catch.
 *
 * @throws {AssertionError} When what settles does not hold.
 */
export async function expectLater<T>(
  actual: Future<T> | (() => Future<T>),
  matcher: Matcher<NoInfer<T>> | Matcher<() => never>,
  reason: string | null = null,
): Future<void> {
  const settled = typeof actual === "function" ? actual() : actual;
  let held: unknown;
  let raised: unknown = null;
  let threw = false;

  try {
    held = await settled;
  } catch (cause) {
    raised = cause;
    threw = true;
  }

  const subject = threw
    ? (() => {
      throw raised;
    })
    : held;

  if (matcher.matches(subject as T)) return;
  throw new AssertionError(sentence(threw ? raised : held, matcher, reason));
}

/**
 * Awaits `actual`, and answers what it raised.
 *
 * @remarks
 * It is for the case that needs the raised value itself, not only whether one arrived: a client
 * exception carrying the address it failed against, an error carrying a code a caller switches on.
 * When only whether something was raised matters, {@link expectLater} with {@link throwsA} says so
 * in one line and needs nothing caught by hand.
 *
 * @throws {AssertionError} When `actual` settles instead of raising.
 */
export async function caught<T>(actual: Future<T> | (() => Future<T>)): Future<unknown> {
  const settled = typeof actual === "function" ? actual() : actual;

  try {
    await settled;
  } catch (raised) {
    return raised;
  }
  throw new AssertionError("It settled instead of raising.");
}

/** What {@link sentence} reads off a matcher, which is everything of it that does not depend on T. */
type Described = Pick<Matcher<never>, "described" | "mismatch">;

/**
 * Fails where it stands, saying why.
 *
 * It is for the branch a case says nothing should reach, which no matcher can express because
 * there is nothing there to hold against anything.
 */
export function fail(reason: string): never {
  throw new AssertionError(reason);
}

/** What a failing check reads as. */
function sentence(actual: unknown, matcher: Described, reason: string | null): string {
  const opening = reason === null ? "The value is not what was expected." : reason;
  const mismatch = matcher.mismatch(actual);
  const found = mismatch ?? `  actual    ${format(actual)}`;

  return `${opening}\n\n  expected  ${matcher.described}\n${found}\n`;
}
