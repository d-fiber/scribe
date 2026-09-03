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
import {
  AssertionError,
  contains,
  equals,
  expect,
  expectLater,
  fail,
  greaterThan,
  hasLength,
  having,
  isA,
  isEmpty,
  isFalse,
  isNot,
  isNotNull,
  isNull,
  isTrue,
  same,
  Scribe,
  throwsA,
  withMessage,
} from "@scribe/alchemy/test";

class Held extends Error {}

function raisedBy(body: () => unknown): AssertionError {
  try {
    body();
  } catch (raised) {
    if (raised instanceof AssertionError) return raised;
    throw raised;
  }
  throw new Error("the body did not refuse");
}

Scribe.test("a value that holds against its matcher passes without a word", () => {
  expect(3, equals(3));
  expect(true, isTrue);
  expect(null, isNull);
  expect("ada", contains("d"));
});

Scribe.test("a value that does not hold says what was expected and what was there", () => {
  const raised = raisedBy(() => expect(2, equals(3)));

  expect(raised.message, contains("equals 3"));
  expect(raised.message, contains("actual    2"));
});

Scribe.test("a reason is what a failure opens with, so several checks in one case are told apart", () => {
  const raised = raisedBy(() => expect(1, equals(2), "the counter did not move"));

  expect(raised.message.startsWith("the counter did not move"), isTrue);
});

Scribe.test("equality is decided all the way down, and by the rules deep equality already had", () => {
  expect({ id: "ada", tags: [1, 2] }, equals({ id: "ada", tags: [1, 2] }));
  expect(NaN, equals(NaN));
  expect(0, isNot(equals(-0)));
});

Scribe.test("sameness is the value itself, which is not the same question as equality", () => {
  const held = { id: "ada" };

  expect(held, same(held));
  expect({ id: "ada" }, isNot(same(held)));
  expect({ id: "ada" }, equals(held));
});

Scribe.test("true and false are those two and nothing that merely looks like them", () => {
  expect(1, isNot(isTrue));
  expect("", isNot(isFalse));
  expect(false, isFalse);
});

Scribe.test("absence covers both the platform has, and presence covers neither", () => {
  expect(null, isNull);
  expect(undefined, isNull);
  expect(0, isNotNull);
  expect("", isNotNull);
});

Scribe.test("what a value was built by is asked without naming its fields", () => {
  expect(new Held("held"), isA(Held));
  expect(new Held("held"), isA(Error));
  expect(new Error("held"), isNot(isA(Held)));
});

Scribe.test("carrying something is asked of a string, a list, a set and a map alike", () => {
  expect("audience", contains("die"));
  expect([1, 2, 3], contains(2));
  expect(new Set(["ada"]), contains("ada"));
  expect([{ id: "ada" }], contains({ id: "ada" }));
});

Scribe.test("how much a value carries is counted, and what carries nothing countable says so", () => {
  expect([1, 2], hasLength(2));
  expect("ada", hasLength(3));
  expect(new Map(), isEmpty);
  expect(raisedBy(() => expect(7, hasLength(1))).message, contains("nothing that can be counted"));
});

Scribe.test("one value is held above or below another", () => {
  expect(3, greaterThan(2));
  expect(raisedBy(() => expect(2, greaterThan(3))).message, contains("greater than 3"));
});

Scribe.test("a call that refuses is held against what it refused with", () => {
  expect(() => {
    throw new Held("the row is gone");
  }, throwsA(isA(Held)));

  expect(() => {
    throw new Held("the row is gone");
  }, throwsA(withMessage("row is gone")));
});

Scribe.test("a call that was meant to refuse and returned is a failure like any other", () => {
  const raised = raisedBy(() => expect(() => 3, throwsA(isA(Held))));

  expect(raised.message, contains("it returned instead"));
});

Scribe.test("what was refused is reached into without catching it by hand", () => {
  expect(
    () => {
      throw new Held("locked");
    },
    throwsA(having(isA(Held), (held) => held.message, "message", equals("locked"))),
  );
});

Scribe.test("a future that rejects is held the same way a call that throws is", async () => {
  await expectLater(() => Promise.reject(new Held("gone")), throwsA(isA(Held)));
});

Scribe.test("a future that settles is held against what it settled to", async () => {
  await expectLater(Promise.resolve(7), equals(7));
});

Scribe.test("failing where it stands says only what it was given to say", () => {
  const raised = raisedBy(() => fail("reached a place nothing should reach"));

  expect(raised.message, equals("reached a place nothing should reach"));
});
