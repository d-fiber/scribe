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
import { AssertionError } from "../expect/error.ts";
import { recorderOrRefuse } from "./mock.ts";
import {
  describe,
  type Expectation,
  fits,
  forgetCaptured,
  keepCaptured,
  NoCallReadError,
  readOne,
  type RecordedCall,
  type Recorder,
} from "./recorder.ts";

/**
 * A check that did not hold.
 *
 * @remarks
 * It descends from {@link AssertionError} rather than from the base the rest of this repository
 * raises, and for the same reason an assertion does: the question it answers is which line of the
 * test failed, and only a stack trace answers that.
 */
export class VerificationError extends AssertionError {}

/**
 * How many times a call was made, once {@link verify} has said which call it is about.
 *
 * @remarks
 * Every member hands back the same check, so several may follow one another, and each one is about
 * the calls the check already matched rather than a new search.
 */
export interface Checked {
  /** How many matching calls were found. */
  readonly count: number;

  /** Refuses unless the call was made exactly once. */
  once(): Checked;

  /** Refuses unless the call was made exactly twice. */
  twice(): Checked;

  /** Refuses unless the call was made exactly `expected` times. */
  times(expected: number): Checked;

  /** Refuses unless the call was made at least `expected` times. */
  atLeast(expected: number): Checked;

  /** Refuses unless the call was made at most `expected` times. */
  atMost(expected: number): Checked;
}

/**
 * Refuses unless the call was made, naming it by making it.
 *
 * @remarks
 * The call is written inside a function for the same reason it is in `when`: the function is run
 * here, with the doubles recording instead of answering, so nothing about the check reaches the
 * subject.
 *
 * A check claims the calls it matched, and a claimed call is never counted again. That is what
 * makes {@link verifyNoMoreInteractions} mean something, and it is why two checks of the same call
 * count separate calls rather than the same one twice.
 *
 * On its own it refuses when the call was never made. The members of {@link Checked} narrow that to
 * an exact number.
 *
 * @example
 * ```ts
 * verify(() => files.list("/packages")).once();
 * verify(() => log.write(anything<string>())).atLeast(3);
 * ```
 */
export function verify<T>(call: () => T): Checked {
  const { on, expectation } = read(call, "verify");

  forgetCaptured(expectation);

  const matched = on.calls.filter(
    (call) => !call.claimed && fits(expectation, call.invocation),
  );
  for (const call of matched) {
    call.claimed = true;
    keepCaptured(expectation, call.invocation);
  }

  if (matched.length === 0) {
    throw new VerificationError(
      `${on.name}.${describe(expectation)} was never called.\n\n${seen(on)}\n`,
    );
  }

  return check(on, expectation, matched.length);
}

/**
 * Refuses when the call was made at all.
 *
 * @remarks
 * It looks at every call the double answered, claimed by an earlier check or not, because a call
 * that happened happened whoever counted it.
 */
export function verifyNever<T>(call: () => T): void {
  const { on, expectation } = read(call, "verifyNever");
  const found = on.calls.filter((call) => fits(expectation, call.invocation));

  if (found.length > 0) {
    throw new VerificationError(
      `${on.name}.${describe(expectation)} was called ${times(found.length)}, and was expected never to be.\n`,
    );
  }
}

/**
 * Refuses unless the calls were all made, in the order they are written.
 *
 * @remarks
 * Other calls may sit between them. What is checked is the order of these calls among themselves,
 * not that nothing else happened, which is what {@link verifyNoMoreInteractions} is for.
 *
 * The calls may be spread over several doubles, and the order still holds across them because each
 * double's calls carry the position they were made at.
 */
export function verifyInOrder(calls: readonly (() => unknown)[]): void {
  const expectations = calls.map((call) => read(call, "verifyInOrder"));

  let from = 0;
  const positions: { on: Recorder; call: RecordedCall }[] = [];

  for (const { on, expectation } of expectations) {
    const at = on.calls.findIndex(
      (call, index) => index >= from && !call.claimed && fits(expectation, call.invocation),
    );

    if (at === -1) {
      throw new VerificationError(
        `${on.name}.${describe(expectation)} was not called in the order given.\n\n${seen(on)}\n`,
      );
    }

    positions.push({ on, call: on.calls[at] });
    keepCaptured(expectation, on.calls[at].invocation);
    from = at + 1;
  }

  for (const { call } of positions) call.claimed = true;
}

/**
 * Refuses when a double answered a call no check has claimed.
 *
 * @remarks
 * It is the counterpart of a check claiming what it counted: everything a case cared about has been
 * named by then, so whatever is left is something the subject did that the case never described.
 */
export function verifyNoMoreInteractions(...doubles: UnmodifiableList<object>): void {
  for (const double of doubles) {
    const on = recorderOrRefuse(double, "verifyNoMoreInteractions");
    const left = on.calls.filter((call) => !call.claimed);

    if (left.length > 0) {
      const listed = left
        .map((call) => `    ${describe(call.invocation)}`)
        .join("\n");
      throw new VerificationError(
        `${on.name} answered ${times(left.length)} no check claimed.\n\n${listed}\n`,
      );
    }
  }
}

/** Reads one call written inside `call`, refusing when it names nothing. */
function read(
  call: () => unknown,
  calledFrom: string,
): { on: Recorder; expectation: Expectation } {
  const found = readOne("checking", call);

  if (found === null) {
    throw new NoCallReadError(
      `${calledFrom}() was handed a function that called nothing on a double.\n\n` +
        `  Write the call inside it, as ${calledFrom}(() => files.list("/packages")).\n`,
    );
  }

  return { on: found.on, expectation: found.invocation };
}

/** The check handed back once the matching calls are known. */
function check(on: Recorder, expectation: Expectation, count: number): Checked {
  const refuse = (wanted: string, held: boolean): Checked => {
    if (!held) {
      throw new VerificationError(
        `${on.name}.${describe(expectation)} was called ${times(count)}, and was expected ${wanted}.\n`,
      );
    }
    return checked;
  };

  const checked: Checked = {
    count,
    once: () => refuse("exactly once", count === 1),
    twice: () => refuse("exactly twice", count === 2),
    times: (expected) => refuse(`exactly ${times(expected)}`, count === expected),
    atLeast: (expected) => refuse(`at least ${times(expected)}`, count >= expected),
    atMost: (expected) => refuse(`at most ${times(expected)}`, count <= expected),
  };

  return checked;
}

/** A count, written the way it reads in a sentence. */
function times(count: number): string {
  if (count === 1) return "once";
  if (count === 2) return "twice";
  return `${count} times`;
}

/** What the double did answer, for a refusal that says a call never happened. */
function seen(on: Recorder): string {
  if (on.calls.length === 0) return `  ${on.name} answered nothing at all.`;
  return `  it answered\n${on.calls.map((call) => `    ${describe(call.invocation)}`).join("\n")}`;
}
