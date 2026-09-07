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
import { declaredTypes, DuplicateDeclarationError, forgetTypes, Type } from "@scribe/alchemy";

Scribe.test("fields keeps only the resolved Postgres type, dropping isPrimary, default and references", () => {
  forgetTypes();
  const declared = Type("type_location_coordinate")
    .fields((c) => ({
      latitude: c.text(),
      longitude: c.text().isPrimary().default("0").references({ table: "somewhere" }),
    }))
    .declareInto("init");

  expect(
    declared,
    equals({
      name: "type_location_coordinate",
      fields: {
        latitude: { kind: "text" },
        longitude: { kind: "text" },
      },
    }),
  );
});

Scribe.test("a type name declared twice, even across two different moments, is refused", () => {
  forgetTypes();
  Type("type_name_conflict").fields((c) => ({ a: c.text() })).declareInto("init");

  expect(
    () => Type("type_name_conflict").fields((c) => ({ a: c.text() })).declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('type "type_name_conflict" is declared twice'))),
  );
});

Scribe.test("declaredTypes filters by the moment it was declared for", () => {
  forgetTypes();
  Type("type_moment_init").fields((c) => ({ a: c.text() })).declareInto("init");
  Type("type_moment_migrations").fields((c) => ({ a: c.text() })).declareInto("migrations");

  const init = declaredTypes("init").map((entry) => entry.name);
  const migrations = declaredTypes("migrations").map((entry) => entry.name);

  expect(init.includes("type_moment_init"), equals(true));
  expect(init.includes("type_moment_migrations"), equals(false));
  expect(migrations.includes("type_moment_migrations"), equals(true));
});

Scribe.test("forgetTypes empties every moment at once", () => {
  forgetTypes();
  Type("type_forget_me").fields((c) => ({ a: c.text() })).declareInto("init");

  forgetTypes();

  expect(declaredTypes("init"), equals([]));
  Type("type_forget_me").fields((c) => ({ a: c.text() })).declareInto("init");
});
