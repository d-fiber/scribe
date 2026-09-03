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

import "@scribe/runtime/scholium/runner.ts";
import { allOf, caught, equals, expect, having, isA, Scribe, withMessage } from "@scribe/alchemy/test";
import { Duration, TimeoutException, withDeadline, withDeadlineLite } from "@scribe/alchemy";

function wait<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function never<T>(): Promise<T> {
  return new Promise<T>(() => {});
}

type Impl = (scope: string, within: Duration, call: Promise<unknown>) => Promise<unknown>;

function suite(name: string, deadline: Impl): void {
  Scribe.test(`${name}: a call that settles before the deadline answers with its own value`, async () => {
    const value = await deadline("t", Duration.milliseconds(200), wait(5, "done"));
    expect(value, equals("done"));
  });

  Scribe.test(`${name}: a call that settles before the deadline propagates its own rejection`, async () => {
    const raised = await caught(() => deadline("t", Duration.milliseconds(200), Promise.reject(new Error("boom"))));
    expect(raised, having(isA(Error), (e) => e.message, "message", equals("boom")));
  });

  Scribe.test(`${name}: a call that never settles is cut off with a TimeoutException naming the scope and the limit`, async () => {
    const raised = await caught(() => deadline("my:scope", Duration.milliseconds(10), never()));
    expect(raised, allOf(isA(TimeoutException), withMessage("[my:scope] exceeded 10ms")));
  });

  Scribe.test(`${name}: a call that fulfils after the deadline does not change what already settled`, async () => {
    const late = wait(20, "late");
    const raised = await caught(() => deadline("t", Duration.milliseconds(5), late));
    await late;

    expect(raised, isA(TimeoutException));
  });

  Scribe.test(`${name}: a call that rejects after the deadline does not change what already settled`, async () => {
    const late = wait(20, null).then(() => Promise.reject(new Error("late failure")));
    const raised = await caught(() => deadline("t", Duration.milliseconds(5), late));
    await late.catch(() => undefined);

    expect(raised, isA(TimeoutException));
  });

  Scribe.test(`${name}: many calls racing their own independent deadlines settle independently`, async () => {
    const [fast, slow] = await Promise.all([
      deadline("fast", Duration.milliseconds(200), wait(5, "fast done")),
      caught(() => deadline("slow", Duration.milliseconds(10), never())),
    ]);

    expect(fast, equals("fast done"));
    expect(slow, isA(TimeoutException));
  });
}

suite("withDeadline", withDeadline);
suite("withDeadlineLite", withDeadlineLite);
