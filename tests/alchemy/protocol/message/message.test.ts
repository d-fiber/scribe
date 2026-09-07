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
import { Message } from "@scribe/alchemy";

Scribe.test("fields() resolves fields in the order given, keyed by field name", () => {
  const declared = Message("Time").fields((f) => ({
    seconds: f.int64().number(1),
    nanos: f.int32().number(2),
  }));

  expect(declared.kind, equals("message"));
  expect(declared.name, equals("Time"));
  expect(
    Object.keys(declared.fields),
    equals(["seconds", "nanos"]),
    "the fields did not come back in the order they were given",
  );
  expect(declared.fields.seconds, equals({ type: { kind: "scalar", scalar: "int64" }, number: 1, optional: false }));
  expect(declared.reservedNumbers, equals([]));
  expect(declared.reservedNames, equals([]));
});

Scribe.test("two fields sharing the same number are refused", () => {
  expect(
    () =>
      Message("Duplicate").fields((f) => ({
        first: f.int32().number(1),
        second: f.string().number(1),
      })),
    throwsA(allOf(isA(Error), withMessage('"Duplicate" reuses the number 1 on field "second"'))),
  );
});

Scribe.test("a field numbered inside a reserved range is refused", () => {
  expect(
    () =>
      Message("Retired").reserved([5]).fields((f) => ({
        legacy: f.int32().number(5),
      })),
    throwsA(allOf(isA(Error), withMessage('"Retired" reuses the number 5 on field "legacy"'))),
  );
});

Scribe.test("reserved numbers and names are carried through unchanged", () => {
  const declared = Message("Versioned")
    .reserved([2, 3])
    .reservedNames(["old_field"])
    .fields((f) => ({ id: f.string().number(1) }));

  expect(declared.reservedNumbers, equals([2, 3]));
  expect(declared.reservedNames, equals(["old_field"]));
});

Scribe.test("a message with no fields resolves to an empty field map", () => {
  const declared = Message("Empty").fields(() => ({}));

  expect(declared.fields, equals({}));
});
