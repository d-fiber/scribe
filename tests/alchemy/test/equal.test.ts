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
import { equal, equals, expect, isFalse, isTrue, Scribe } from "@scribe/alchemy/test";

Scribe.test("a value equals itself whatever it is", () => {
  expect(equal(1, 1), isTrue, "two of the same number are not equal");
  expect(equal("ada", "ada"), isTrue, "two of the same string are not equal");
  expect(equal(null, null), isTrue, "null is not equal to null");
  expect(equal(undefined, undefined), isTrue, "undefined is not equal to undefined");
});

Scribe.test("NaN equals itself, which is the one place strict equality lies", () => {
  expect(equal(NaN, NaN), isTrue, "NaN is not equal to itself");
  expect(equal([NaN], [NaN]), isTrue, "NaN nested in an array is not equal to itself");
});

Scribe.test("the two zeros are told apart", () => {
  expect(equal(0, -0), isFalse, "positive zero was taken for negative zero");
});

Scribe.test("a structure that points back at itself answers instead of running forever", () => {
  const left: Record<string, unknown> = { name: "ada" };
  left.self = left;
  const right: Record<string, unknown> = { name: "ada" };
  right.self = right;

  expect(equal(left, right), isTrue, "two identically cyclic structures are not equal");
});

Scribe.test("two cyclic structures that differ below the cycle are told apart", () => {
  const left: Record<string, unknown> = { name: "ada" };
  left.self = left;
  const right: Record<string, unknown> = { name: "grace" };
  right.self = right;

  expect(equal(left, right), isFalse, "two cyclic structures with different fields were taken for one");
});

Scribe.test("a map ignores the order its entries were put in", () => {
  const left = new Map([["a", 1], ["b", 2]]);
  const right = new Map([["b", 2], ["a", 1]]);

  expect(equal(left, right), isTrue, "two maps holding the same entries in another order are not equal");
});

Scribe.test("a map matches a key that is itself a structure", () => {
  const left = new Map([[{ id: "ada" }, 1]]);
  const right = new Map([[{ id: "ada" }, 1]]);

  expect(equal(left, right), isTrue, "a key was matched by identity rather than by what it holds");
});

Scribe.test("a map of the same size with a key that is missing is told apart", () => {
  expect(
    equal(new Map([["a", 1]]), new Map([["b", 1]])),
    isFalse,
    "two maps holding different keys were taken for one",
  );
});

Scribe.test("a set ignores order and matches structures", () => {
  expect(equal(new Set([1, 2]), new Set([2, 1])), isTrue, "two sets holding the same members are not equal");
  expect(equal(new Set([{ id: "ada" }]), new Set([{ id: "ada" }])), isTrue, "a member was matched by identity");
  expect(equal(new Set([1, 2]), new Set([1, 3])), isFalse, "two sets holding different members were taken for one");
});

Scribe.test("a date is compared on its time and not on being the same object", () => {
  expect(equal(new Date(0), new Date(0)), isTrue, "two dates at the same instant are not equal");
  expect(equal(new Date(0), new Date(1)), isFalse, "two dates at different instants were taken for one");
});

Scribe.test("a pattern is compared on its source and its flags", () => {
  expect(equal(/ada/gi, /ada/gi), isTrue, "two identical patterns are not equal");
  expect(equal(/ada/g, /ada/i), isFalse, "two patterns with different flags were taken for one");
});

Scribe.test("bytes are compared by what they hold, whatever view holds them", () => {
  expect(equal(new Uint8Array([1, 2]), new Uint8Array([1, 2])), isTrue, "two identical byte arrays are not equal");
  expect(
    equal(new Uint8Array([1, 2]), new Uint8Array([1, 3])),
    isFalse,
    "two different byte arrays were taken for one",
  );
  expect(equal(new Uint8Array([1]), new Uint16Array([1])), isFalse, "two different views were taken for one");
});

Scribe.test("an instance never equals a literal carrying the same fields", () => {
  class Member {
    constructor(public readonly id: string) {}
  }

  expect(equal(new Member("ada"), { id: "ada" }), isFalse, "an instance was taken for a literal");
  expect(equal(new Member("ada"), new Member("ada")), isTrue, "two instances holding the same field are not equal");
});

Scribe.test("an error is compared on its name and its message", () => {
  expect(equal(new Error("gone"), new Error("gone")), isTrue, "two identical errors are not equal");
  expect(equal(new Error("gone"), new Error("here")), isFalse, "two errors with different messages were taken for one");
  expect(equal(new Error("gone"), new TypeError("gone")), isFalse, "two errors of different kinds were taken for one");
});

Scribe.test("a boxed primitive is compared on the value it wraps", () => {
  expect(equal(new Number(1), new Number(1)), isTrue, "two boxes holding the same number are not equal");
  expect(equal(new Number(1), new Number(2)), isFalse, "two boxes holding different numbers were taken for one");
});

Scribe.test("an array is compared on its length before its members", () => {
  expect(equal([1, [2, [3]]], [1, [2, [3]]]), isTrue, "two identically nested arrays are not equal");
  expect(equal([1, 2], [1, 2, undefined]), isFalse, "an array was taken for a longer one");
});

Scribe.test("an object with a field that is absent is not one with the field set to undefined", () => {
  expect(equal({ id: "ada" }, { id: "ada", at: undefined }), isFalse, "a missing field was taken for an undefined one");
});

Scribe.test("an enumerable symbol counts as a field", () => {
  const key = Symbol.for("scribe.test.key");

  expect(equal({ [key]: 1 }, { [key]: 1 }), isTrue, "two objects holding the same symbol are not equal");
  expect(equal({ [key]: 1 }, { [key]: 2 }), isFalse, "two objects holding different symbol values were taken for one");
});

Scribe.test("a weak collection is never equal, since nothing can look inside one", () => {
  expect(equal(new WeakMap(), new WeakMap()), isFalse, "two weak maps were claimed to be equal");
});

Scribe.test("a page of rows is compared field by field", () => {
  const left = { items: [{ id: "ada" }], pagination: { offset: 0, total: 1, has_more: false } };
  const right = { items: [{ id: "ada" }], pagination: { offset: 0, total: 1, has_more: false } };

  expect(left, equals(right), "two identical pages are not equal");
});
