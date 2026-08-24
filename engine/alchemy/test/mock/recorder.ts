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

import type { UnmodifiableList } from "../../value/list.ts";
import { ScribeError } from "../../error/scribe_error.ts";
import { equal } from "../expect/equal.ts";
import { format } from "../expect/error.ts";
import { type ArgumentMatcher, isMatcher } from "./matcher.ts";

/** One call to a member of a double, as it was made. */
export interface Invocation {
  /** The member that was called. */
  readonly member: string;

  /** What the caller passed, in order. */
  readonly args: UnmodifiableList<unknown>;
}

/** A call a double answered, and whether a check has already claimed it. */
export interface RecordedCall {
  /** The call itself. */
  readonly invocation: Invocation;

  /** Whether a check has counted this call. A call is counted once and never twice. */
  claimed: boolean;
}

/** A shape of call, written with values, matchers, or both, that a stub or a check is about. */
export interface Expectation {
  /** The member the shape is about. */
  readonly member: string;

  /** What each argument has to be, or a matcher standing for it. */
  readonly args: UnmodifiableList<unknown>;
}

/** An answer a double gives when a call fits the shape it was declared for. */
export interface Answer {
  /** The shape of call this answer is for. */
  readonly expectation: Expectation;

  /** What the double does when the call fits. It either returns or raises. */
  respond(args: UnmodifiableList<unknown>): unknown;
}

/**
 * What the surface is doing at this instant, and the only piece of state the doubles share.
 *
 * @remarks
 * It is set around the function `when` and `verify` are handed and put back in a `finally`, so it
 * is never open across two statements of a test. Outside those two windows it reads `answering`,
 * which is the only state in which a double consults its answers or refuses.
 */
export type Intent = "answering" | "declaring" | "checking";

let intent: Intent = "answering";
let noted: Noted | null = null;

/** A call seen while `when` or `verify` was reading, kept until the one that asked collects it. */
interface Noted {
  /** The double the call was made on. */
  readonly on: Recorder;

  /** The call, whose arguments may be matchers rather than values. */
  readonly invocation: Invocation;
}

/**
 * A function handed to `when` or `verify` that called nothing on a double.
 *
 * @remarks
 * It is raised where it happened rather than at the next statement, which is what a caller needs:
 * the usual causes are a real object passed where a double was meant, and a member read without
 * being called.
 */
export class NoCallReadError extends ScribeError {}

/** What the surface is doing at this instant. */
export function currentIntent(): Intent {
  return intent;
}

/**
 * Reads `call` with the surface set to `next`, and hands back the one invocation it made.
 *
 * @remarks
 * Answering null rather than raising is deliberate: the caller knows whether it was reading for a
 * stub or for a check, so it is the one that can say what was expected instead.
 */
export function readOne(next: Intent, call: () => unknown): Noted | null {
  const held = intent;
  intent = next;
  noted = null;

  try {
    call();
    return noted;
  } finally {
    intent = held;
    noted = null;
  }
}

/** Puts one call aside for whoever set the intent, replacing anything noted before it. */
export function note(on: Recorder, invocation: Invocation): void {
  noted = { on, invocation };
}

/** Puts the surface back to answering, whatever it was doing. */
export function forgetIntent(): void {
  intent = "answering";
  noted = null;
}

/**
 * Whether `invocation` fits `expectation`, comparing plain arguments by value.
 *
 * @remarks
 * A call with a different number of arguments never fits, so a member called two ways keeps its
 * two shapes apart instead of the shorter one standing for both.
 */
export function fits(
  expectation: Expectation,
  invocation: Invocation,
): boolean {
  if (expectation.member !== invocation.member) return false;
  if (expectation.args.length !== invocation.args.length) return false;

  return expectation.args.every((expected, at) => {
    const actual = invocation.args[at];
    return isMatcher(expected) ? expected.matches(actual) : equal(actual, expected);
  });
}

/** Hands each capturing matcher of `expectation` what the matched `invocation` carried. */
export function keepCaptured(
  expectation: Expectation,
  invocation: Invocation,
): void {
  expectation.args.forEach((expected, at) => {
    if (isMatcher(expected)) expected.keep(invocation.args[at]);
  });
}

/** Drops what every capturing matcher of `expectation` kept, so one check does not see another's. */
export function forgetCaptured(expectation: Expectation): void {
  for (const expected of expectation.args) {
    if (isMatcher(expected)) expected.forget();
  }
}

/** How a call reads in a refusal, with matchers written as what they stand for. */
export function describe(shape: Expectation | Invocation): string {
  const args = shape.args
    .map((arg) => isMatcher(arg) ? (arg as ArgumentMatcher).described : format(arg))
    .join(", ");
  return `${shape.member}(${args})`;
}

/**
 * What one double remembers: the calls it answered and the answers it was given.
 *
 * @remarks
 * It is separate from the double itself because the double is a proxy, and every property read on a
 * proxy has to be a member of the type it stands for. Keeping the memory beside it rather than on
 * it is what lets a type be doubled without a single name reserved.
 */
export class Recorder {
  /** How this double reads in a refusal. */
  readonly name: string;

  /** Every call made to this double, in the order they were made. */
  readonly #calls: RecordedCall[] = [];

  /** What was declared to answer a call, the last one declared winning. */
  readonly #answers: Answer[] = [];

  /**
   * Opens the memory of a double called `name`.
   *
   * @param name - What the double is called, which is what a refusal quotes back.
   */
  constructor(name: string) {
    this.name = name;
  }

  /** Every call this double answered, in order, whether or not a check has claimed it. */
  get calls(): UnmodifiableList<RecordedCall> {
    return this.#calls;
  }

  /** Records a real call and hands back what it was recorded as. */
  record(invocation: Invocation): RecordedCall {
    const call: RecordedCall = { invocation, claimed: false };
    this.#calls.push(call);
    return call;
  }

  /**
   * The answer a call is given, or null when nothing was declared for it.
   *
   * The last answer declared wins, so a test that narrows a general answer with a precise one gets
   * the precise one without having to undo the first.
   */
  answerFor(invocation: Invocation): Answer | null {
    for (let at = this.#answers.length - 1; at >= 0; at -= 1) {
      const answer = this.#answers[at];
      if (fits(answer.expectation, invocation)) return answer;
    }
    return null;
  }

  /** Adds an answer, which from now on wins over everything declared before it. */
  declare(answer: Answer): void {
    this.#answers.push(answer);
  }

  /** Forgets every call and every answer, leaving the double as it was built. */
  reset(): void {
    this.#calls.length = 0;
    this.#answers.length = 0;
  }

  /** Forgets every call, and keeps the answers. */
  clearCalls(): void {
    this.#calls.length = 0;
  }
}
