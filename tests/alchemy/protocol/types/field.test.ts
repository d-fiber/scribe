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

import "@scribe/scholium/runner.ts";
import { allOf, equals, expect, isA, Scribe, throwsA, withMessage } from "@scribe/alchemy/test";
import { FieldFactory, fieldsOf } from "@scribe/alchemy";

Scribe.test("fieldsOf() resolves a scalar field and a map field, by field name", () => {
  const resolved = fieldsOf({
    id: new FieldFactory().int32().number(1),
    tags: new FieldFactory().map("string", (v) => v.bool()).number(2),
  });

  expect(
    resolved,
    equals({
      id: { type: { kind: "scalar", scalar: "int32" }, number: 1, optional: false },
      tags: {
        type: { kind: "map", key: "string", value: { kind: "scalar", scalar: "bool" } },
        number: 2,
        optional: false,
      },
    }),
  );
});

Scribe.test("repeated() wraps the base type rather than replacing it", () => {
  const field = new FieldFactory().string().repeated().number(3).build();

  expect(field.type, equals({ kind: "repeated", of: { kind: "scalar", scalar: "string" } }));
});

Scribe.test("optional() is false unless called", () => {
  const bare = new FieldFactory().string().number(1).build();
  const marked = new FieldFactory().string().optional().number(2).build();

  expect(bare.optional, equals(false));
  expect(marked.optional, equals(true));
});

Scribe.test("a map field is always resolved as non-optional", () => {
  const field = new FieldFactory().map("string", (v) => v.int32()).number(1).build();

  expect(field.optional, equals(false));
});

Scribe.test("enum and message field types name the declaration they reference", () => {
  const enumField = new FieldFactory().enum("LogLevel").number(1).build();
  const messageField = new FieldFactory().message("Time").number(2).build();

  expect(enumField.type, equals({ kind: "enum", name: "LogLevel" }));
  expect(messageField.type, equals({ kind: "message", name: "Time" }));
});

Scribe.test("number(1) and number(536_870_911) are the two ends of the range proto3 allows", () => {
  const lowest = new FieldFactory().string().number(1).build();
  const highest = new FieldFactory().string().number(536_870_911).build();

  expect(lowest.number, equals(1));
  expect(highest.number, equals(536_870_911));
});

Scribe.test("number(0) is refused, proto3 field numbers start at 1", () => {
  expect(
    () => new FieldFactory().string().number(0),
    throwsA(allOf(isA(Error), withMessage("0 is not a valid proto3 field number"))),
  );
});

Scribe.test("a negative number is refused", () => {
  expect(
    () => new FieldFactory().string().number(-1),
    throwsA(allOf(isA(Error), withMessage("-1 is not a valid proto3 field number"))),
  );
});

Scribe.test("a non-integer number is refused", () => {
  expect(
    () => new FieldFactory().string().number(1.5),
    throwsA(allOf(isA(Error), withMessage("1.5 is not a valid proto3 field number"))),
  );
});

Scribe.test("a number past 536_870_911 is refused", () => {
  expect(
    () => new FieldFactory().string().number(536_870_912),
    throwsA(allOf(isA(Error), withMessage("536870912 is not a valid proto3 field number"))),
  );
});

Scribe.test("18999 and 20000, just outside the reserved window, are accepted", () => {
  const before = new FieldFactory().string().number(18_999).build();
  const after = new FieldFactory().string().number(20_000).build();

  expect(before.number, equals(18_999));
  expect(after.number, equals(20_000));
});

Scribe.test("a number inside 19000-19999 is refused, the range proto3 reserves for itself", () => {
  expect(
    () => new FieldFactory().string().number(19_000),
    throwsA(allOf(isA(Error), withMessage("19000 falls inside 19000-19999"))),
  );
  expect(
    () => new FieldFactory().string().number(19_500),
    throwsA(allOf(isA(Error), withMessage("19500 falls inside 19000-19999"))),
  );
  expect(
    () => new FieldFactory().string().number(19_999),
    throwsA(allOf(isA(Error), withMessage("19999 falls inside 19000-19999"))),
  );
});

Scribe.test("a map field's number is validated the same way a scalar field's is", () => {
  expect(
    () => new FieldFactory().map("string", (v) => v.int32()).number(19_500),
    throwsA(allOf(isA(Error), withMessage("19500 falls inside 19000-19999"))),
  );
});
