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
import { declaredSequences, DuplicateDeclarationError, forgetSequences, Sequence } from "@scribe/alchemy";

Scribe.test("create with no modifier leaves every optional field null, and cycle false", () => {
  forgetSequences();
  const declared = Sequence("sequence_bare").create().declareInto("init");

  expect(
    declared,
    equals({
      name: "sequence_bare",
      as: null,
      incrementBy: null,
      minValue: null,
      maxValue: null,
      startWith: null,
      cache: null,
      cycle: false,
      ownedBy: null,
    }),
  );
});

Scribe.test("every modifier is carried through once set, including a none bound", () => {
  forgetSequences();
  const declared = Sequence("sequence_full")
    .as("integer")
    .incrementBy(-1)
    .minValue("none")
    .maxValue(1000)
    .startWith(500)
    .cache(10)
    .cycle()
    .create()
    .declareInto("init");

  expect(
    declared,
    equals({
      name: "sequence_full",
      as: "integer",
      incrementBy: -1,
      minValue: "none",
      maxValue: 1000,
      startWith: 500,
      cache: 10,
      cycle: true,
      ownedBy: null,
    }),
  );
});

Scribe.test("ownedBy ties this sequence to a table and column", () => {
  forgetSequences();
  const declared = Sequence("sequence_owned").ownedBy("bookings", "reference").create().declareInto("init");

  expect(declared.ownedBy, equals({ table: "bookings", column: "reference" }));
});

Scribe.test("a sequence name declared twice, even across two different moments, is refused", () => {
  forgetSequences();
  Sequence("sequence_name_conflict").create().declareInto("init");

  expect(
    () => Sequence("sequence_name_conflict").create().declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('sequence "sequence_name_conflict" is declared twice'))),
  );
});

Scribe.test("declaredSequences filters by the moment it was declared for", () => {
  forgetSequences();
  Sequence("sequence_moment_init").create().declareInto("init");
  Sequence("sequence_moment_migrations").create().declareInto("migrations");

  const init = declaredSequences("init").map((entry) => entry.name);
  const migrations = declaredSequences("migrations").map((entry) => entry.name);

  expect(init.includes("sequence_moment_init"), equals(true));
  expect(init.includes("sequence_moment_migrations"), equals(false));
  expect(migrations.includes("sequence_moment_migrations"), equals(true));
});

Scribe.test("forgetSequences empties every moment at once", () => {
  forgetSequences();
  Sequence("sequence_forget_me").create().declareInto("init");

  forgetSequences();

  expect(declaredSequences("init"), equals([]));
  Sequence("sequence_forget_me").create().declareInto("init");
});
