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
import type { List, UnmodifiableList } from "../../value/list.ts";
import { type Answer, describe, type Expectation, NoCallReadError, readOne } from "./recorder.ts";

/**
 * What a call is answered with, once `when` has said which call it is about.
 *
 * @remarks
 * Every member ends the declaration, so a shape of call is never left half declared. Declaring the
 * same shape again is allowed and wins over what came before, which is how a case narrows a general
 * answer without undoing it.
 */
export interface Answers<T> {
  /** Answers `value`, as many times as the call is made. */
  thenReturn(value: T): void;

  /** Raises `raised` instead of answering. */
  thenThrow(raised: unknown): void;

  /**
   * Answers what `respond` works out from the arguments of the call being made.
   *
   * @param respond - Called with the arguments the caller passed, in order. They arrive as
   * `unknown` because the shape `when` read carries the return type of the member and not its
   * parameters.
   */
  thenAnswer(respond: (...args: List<unknown>) => T): void;

  /**
   * Answers `values` in order, one per call.
   *
   * Once they run out the call refuses, because a case that declared three answers and was called
   * four times is a case whose subject did something it did not describe.
   */
  thenReturnEach(values: UnmodifiableList<T>): void;

  /**
   * Answers a promise that resolves to `value`.
   *
   * It cannot be written for a member that does not answer a promise: there its argument is `never`,
   * so nothing can be passed to it.
   */
  thenResolve(value: T extends Future<infer Held> ? Held : never): void;

  /**
   * Answers a promise that rejects with `raised`.
   *
   * It cannot be written for a member that does not answer a promise, for the same reason as
   * {@link thenResolve}.
   */
  thenReject(raised: T extends Future<unknown> ? unknown : never): void;
}

/**
 * Says what a call answers, naming the call by making it.
 *
 * @remarks
 * The call is written inside a function rather than passed as a value, and that is what makes the
 * rest work: `when` runs the function itself, with the doubles set to record instead of answer. So
 * the call never reaches the answers, a matcher only ever exists while it is being read, and the
 * member and its arguments are both known without either being named as a string.
 *
 * @example
 * ```ts
 * when(() => clock.now()).thenReturn(noon);
 * when(() => store.get(anything<string>())).thenResolve(null);
 * when(() => store.put(row)).thenThrow(new Conflict());
 * ```
 */
export function when<T>(call: () => T): Answers<T> {
  const read = readOne("declaring", call as () => unknown);

  if (read === null) {
    throw new NoCallReadError(
      "when() was handed a function that called nothing on a double.\n\n" +
        '  Write the call inside it, as when(() => files.list("/packages")).\n',
    );
  }

  const expectation: Expectation = read.invocation;
  const declare = (respond: (args: UnmodifiableList<unknown>) => unknown) => {
    read.on.declare({ expectation, respond } as Answer);
  };

  return {
    thenReturn(value) {
      declare(() => value);
    },

    thenThrow(raised) {
      declare(() => {
        throw raised;
      });
    },

    thenAnswer(respond) {
      declare((args) => respond(...args));
    },

    thenReturnEach(values) {
      let at = 0;
      declare(() => {
        if (at >= values.length) {
          throw new NoCallReadError(
            `${read.on.name}.${describe(expectation)} was given ${values.length} answers ` +
              `and has now been called ${at + 1} times.`,
          );
        }
        const value = values[at];
        at += 1;
        return value;
      });
    },

    thenResolve(value) {
      declare(() => Promise.resolve(value));
    },

    thenReject(raised) {
      declare(() => Promise.reject(raised));
    },
  };
}
