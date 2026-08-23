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

import { contains, equals, expect, expectLater, having, isA, throwsA } from "../../src/test/mod.ts";
import { Duration, Future, unawaited } from "../../mod.ts";

Deno.test("a delayed future settles with what it was given, after the wait", async () => {
  expect(await Future.delayed(Duration.milliseconds(1), 42), equals(42));
  expect(await Future.delayed(Duration.milliseconds(1)), equals(undefined));
});

Deno.test("a future already settled answers without waiting for anything", async () => {
  expect(await Future.value(7), equals(7));
  await expectLater(
    () => Future.error(new Error("refused")),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("refused"))),
  );
});

Deno.test("waiting on several answers all of them, in the order they were given", async () => {
  const held = await Future.wait([
    Future.delayed(Duration.milliseconds(4), "slow"),
    Future.value("quick"),
  ]);

  expect(held, equals(["slow", "quick"]));
});

Deno.test("any settles with the first one to settle, and the losers carry on", async () => {
  const slow = Future.delayed(Duration.milliseconds(8), "slow");
  const quick = Future.delayed(Duration.milliseconds(1), "quick");

  expect(await Future.race([slow, quick]), equals("quick"));
  expect(await slow, equals("slow"));
});

Deno.test("a microtask runs after the work in hand, not during it", async () => {
  const order: string[] = [];
  const held = Future.microtask(() => order.push("after"));

  order.push("during");
  await held;

  expect(order, equals(["during", "after"]));
});

Deno.test("detached work that fails is logged rather than left to nobody", async () => {
  const raised: unknown[] = [];
  const before = console.error;
  console.error = (...args: unknown[]) => void raised.push(args[1]);

  unawaited(Future.error(new Error("the body failed")));
  await Future.delayed(Duration.milliseconds(2));

  console.error = before;
  expect((raised[0] as Error).message, equals("the body failed"));
});

Deno.test("racing settles on the first to finish, failure and all", async () => {
  const slow = Future.delayed(Duration.milliseconds(5), "slow");
  const failing = Future.error<string>(new Error("first back"));

  await expectLater(
    () => Future.race([failing, slow]),
    throwsA(having(isA(Error), (raised) => raised.message, "message", equals("first back"))),
  );
  await slow;
});

Deno.test("asking for the first to succeed steps over the one that failed", async () => {
  const failing = Future.error<string>(new Error("primary is down"));
  const fallback = Future.delayed(Duration.milliseconds(5), "fallback");

  expect(await Future.firstSucceeding([failing, fallback]), equals("fallback"));
});
