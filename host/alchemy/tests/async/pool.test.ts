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

import { equals, expect, expectLater, having, isA, isTrue, throwsA } from "../../test/mod.ts";
import { Duration, Future, runPooled } from "../../mod.ts";

Deno.test("runPooled visits every item exactly once", async () => {
  const seen: number[] = [];
  const items = Array.from({ length: 25 }, (_, i) => i);

  await runPooled(items, 4, (item) => {
    seen.push(item);
    return Promise.resolve();
  });

  expect(seen.length, equals(25));
  expect([...seen].sort((a, b) => a - b), equals(items));
});

Deno.test("runPooled never exceeds the requested concurrency", async () => {
  let inFlight = 0;
  let peak = 0;

  await runPooled(Array.from({ length: 30 }, (_, i) => i), 3, async () => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await Future.delayed(Duration.milliseconds(1));
    inFlight--;
  });

  expect(peak <= 3, isTrue, `peak concurrency was ${peak}`);
});

Deno.test("runPooled still runs everything when the limit is zero or negative", async () => {
  const seen: number[] = [];

  await runPooled([1, 2, 3], 0, (item) => {
    seen.push(item);
    return Promise.resolve();
  });
  await runPooled([4, 5], -1, (item) => {
    seen.push(item);
    return Promise.resolve();
  });

  expect(seen, equals([1, 2, 3, 4, 5]));
});

Deno.test("runPooled on an empty list resolves without calling the worker", async () => {
  let calls = 0;

  await runPooled([], 4, () => {
    calls++;
    return Promise.resolve();
  });

  expect(calls, equals(0));
});

Deno.test("a call that fails stops the pool rather than letting the rest run on unwatched", async () => {
  const done: number[] = [];

  await runPooled([1, 2, 3, 4, 5, 6], 2, async (item) => {
    if (item === 1) {
      await Future.delayed(Duration.milliseconds(1));
      throw new Error("boom");
    }
    await Future.delayed(Duration.milliseconds(5));
    done.push(item);
  }).catch(() => {});

  const settledAtFailure = [...done];
  await Future.delayed(Duration.milliseconds(60));

  expect(done, equals(settledAtFailure), "the pool went on working after the caller was told it failed");
});

Deno.test("the failure a caller is handed is the one that stopped the pool", async () => {
  await expectLater(
    () =>
      runPooled([1, 2], 1, (item) => {
        if (item === 1) return Promise.reject(new Error("first"));
        return Promise.reject(new Error("second"));
      }),
    throwsA(having(isA(Error), (raised) => raised.message, "message", equals("first"))),
  );
});
