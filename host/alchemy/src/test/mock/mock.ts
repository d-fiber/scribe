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
import { ScribeError } from "../../error/scribe_error.ts";
import { currentIntent, describe, type Invocation, keepCaptured, note, Recorder } from "./recorder.ts";

/** Where a double keeps its memory, hidden from the type it stands for. */
const RECORDER = Symbol.for("scribe.alchemy.recorder");

/**
 * A call nothing answers.
 *
 * @remarks
 * A double refuses rather than answering nothing, because a call nobody thought about is a hole in
 * the test rather than a value the subject should carry on with. Answering `undefined` would let
 * that hole travel, and it would surface later as a fault somewhere the test never mentions.
 *
 * It descends from {@link ScribeError} because it is a fault in what somebody wrote: the message
 * says which call was made and what to write to answer it.
 */
export class MissingAnswerError extends ScribeError {}

/** Everything a double is asked to be, beyond the type it stands for. */
export interface DoubleOptions {
  /** How this double reads in a refusal. Left out, it reads `double`. */
  readonly named?: string;
}

const scopes: List<Recorder>[] = [];

/** Opens a scope that owns the doubles built inside it. Only a runner calls this. */
export function openScope(): void {
  scopes.push([]);
}

/** Closes the innermost scope and empties every double it owns. Only a runner calls this. */
export function closeScope(): void {
  for (const recorder of scopes.pop() ?? []) recorder.reset();
}

/** The memory behind `value`, or null when `value` is not a double. */
export function recorderOf(value: unknown): Recorder | null {
  if (typeof value !== "object" || value === null) return null;
  const held = (value as Record<symbol, unknown>)[RECORDER];
  return held instanceof Recorder ? held : null;
}

/** The memory behind `value`, refusing when `value` is not a double. */
export function recorderOrRefuse(value: unknown, calledFrom: string): Recorder {
  const recorder = recorderOf(value);
  if (recorder === null) {
    throw new MissingAnswerError(
      `${calledFrom} was handed something that is not a double.`,
    );
  }
  return recorder;
}

/**
 * A stand-in for `T` that answers what a test declared, and remembers every call it was given.
 *
 * @remarks
 * It stands for the members of `T` that are called. A property read that is not a call answers
 * nothing, so a type whose surface is data rather than behaviour is not what this is for.
 *
 * A double built inside a running case belongs to that case, and is emptied when the case ends.
 * Nothing carries from one case to the next, and there is no state to put back by hand.
 *
 * @example
 * ```ts
 * const files = mock<FileSystem>({ named: "files" });
 * when(() => files.list("/packages")).thenReturn(["realtime"]);
 * ```
 */
export function mock<T extends object>(options: DoubleOptions = {}): T {
  const recorder = new Recorder(options.named ?? "double");
  const members = new Map<string, (...args: List<unknown>) => unknown>();

  scopes[scopes.length - 1]?.push(recorder);

  const double = new Proxy({} as Record<string | symbol, unknown>, {
    get(_target, property): unknown {
      if (property === RECORDER) return recorder;
      if (property === Symbol.toStringTag) return recorder.name;
      if (typeof property === "symbol" || property === "then") return undefined;

      const held = members.get(property);
      if (held) return held;

      const member = (...args: List<unknown>) => answer(recorder, { member: property, args });
      Object.defineProperty(member, "name", { value: property });
      members.set(property, member);
      return member;
    },

    has(_target, property): boolean {
      return property === RECORDER || typeof property === "string";
    },
  });

  return double as T;
}

/** Answers one call, or notes it when `when` or `verify` is the one reading. */
function answer(recorder: Recorder, invocation: Invocation): unknown {
  if (currentIntent() !== "answering") {
    note(recorder, invocation);
    return undefined;
  }

  recorder.record(invocation);

  const declared = recorder.answerFor(invocation);
  if (declared === null) {
    throw new MissingAnswerError(
      `${recorder.name}.${describe(invocation)} has no answer.\n\n` +
        `  Declare one with when(() => ${recorder.name}.${describe(invocation)}).thenReturn(...).\n`,
    );
  }

  keepCaptured(declared.expectation, invocation);
  return declared.respond(invocation.args);
}

/** Forgets every call and every answer `double` holds, leaving it as it was built. */
export function reset(double: object): void {
  recorderOrRefuse(double, "reset").reset();
}

/** Forgets every call `double` answered, and keeps what it was told to answer. */
export function clearCalls(double: object): void {
  recorderOrRefuse(double, "clearCalls").clearCalls();
}

/** Every call `double` answered, in order, as it was made. */
export function callsOf(double: object): UnmodifiableList<Invocation> {
  return recorderOrRefuse(double, "callsOf").calls.map(
    (call) => call.invocation,
  );
}
