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
import type { DeclaredProtoEnum, EnumFactory } from "@scribe/alchemy";
import { ProtocolContentFactory } from "@scribe/alchemy";

function ProtoEnum(build: (e: EnumFactory) => DeclaredProtoEnum): DeclaredProtoEnum {
  return new ProtocolContentFactory().enum(build);
}

Scribe.test("values() resolves in order, first numbered 0", () => {
  const declared = ProtoEnum((e) =>
    e.name("LogLevel").values((v) => [
      v.value("LOG_LEVEL_UNSPECIFIED").number(0),
      v.value("LOG_LEVEL_DEBUG").number(1),
    ])
  );

  expect(declared.kind, equals("enum"));
  expect(declared.name, equals("LogLevel"));
  expect(
    declared.values,
    equals([
      { name: "LOG_LEVEL_UNSPECIFIED", number: 0 },
      { name: "LOG_LEVEL_DEBUG", number: 1 },
    ]),
  );
});

Scribe.test("an empty values array is refused", () => {
  expect(
    () => ProtoEnum((e) => e.name("Empty").values(() => [])),
    throwsA(allOf(isA(Error), withMessage('Enum "Empty" must open with a value numbered 0'))),
  );
});

Scribe.test("a first value not numbered 0 is refused", () => {
  expect(
    () => ProtoEnum((e) => e.name("Skewed").values((v) => [v.value("FIRST").number(1)])),
    throwsA(allOf(isA(Error), withMessage('Enum "Skewed" must open with a value numbered 0'))),
  );
});

Scribe.test("a duplicate number across two values is refused", () => {
  expect(
    () =>
      ProtoEnum((e) =>
        e.name("Repeated").values((v) => [
          v.value("A").number(0),
          v.value("B").number(0),
        ])
      ),
    throwsA(allOf(isA(Error), withMessage('Enum "Repeated" reuses the number 0'))),
  );
});

Scribe.test("a number within a reserved range is refused", () => {
  expect(
    () =>
      ProtoEnum((e) =>
        e.name("Retired").reserved([1]).values((v) => [
          v.value("A").number(0),
          v.value("B").number(1),
        ])
      ),
    throwsA(allOf(isA(Error), withMessage('Enum "Retired" reuses the number 1'))),
  );
});

Scribe.test("reserved numbers and names are carried through unchanged", () => {
  const declared = ProtoEnum((e) =>
    e.name("Versioned").reserved([4]).reservedNames(["OLD"]).values((v) => [v.value("A").number(0)])
  );

  expect(declared.reservedNumbers, equals([4]));
  expect(declared.reservedNames, equals(["OLD"]));
});
