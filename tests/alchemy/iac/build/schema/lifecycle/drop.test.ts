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
import { declaredDrops, Drop, DropDeclaration, DuplicateDeclarationError, forgetDrops } from "@scribe/alchemy";

Scribe.test("table, index, type and extension each refuse the same name declared twice", () => {
  forgetDrops();
  Drop("drop_table_conflict").table().declareInto("migrations");
  Drop("drop_index_conflict").index().declareInto("migrations");
  Drop("drop_type_conflict").type().declareInto("migrations");
  Drop("drop_extension_conflict").extension().declareInto("migrations");

  expect(
    () => Drop("drop_table_conflict").table().declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
  expect(
    () => Drop("drop_index_conflict").index().declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
  expect(
    () => Drop("drop_type_conflict").type().declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
  expect(
    () => Drop("drop_extension_conflict").extension().declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("a policy dropped twice under the same table is refused", () => {
  forgetDrops();
  Drop("drop_policy_conflict").policy("drop_policy_table").declareInto("migrations");

  expect(
    () => Drop("drop_policy_conflict").policy("drop_policy_table").declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage("declared twice"))),
  );
});

Scribe.test("a policy dropped under two different tables, same name, does not collide", () => {
  forgetDrops();
  const first = Drop("drop_policy_shared_name").policy("drop_policy_table_a").declareInto("migrations");
  const second = Drop("drop_policy_shared_name").policy("drop_policy_table_b").declareInto("migrations");

  expect(
    first,
    equals({ kind: "policy", name: "drop_policy_shared_name", table: "drop_policy_table_a", cascade: false }),
  );
  expect(
    second,
    equals({ kind: "policy", name: "drop_policy_shared_name", table: "drop_policy_table_b", cascade: false }),
  );
});

Scribe.test("a table drop and an index drop sharing the same textual name do not collide", () => {
  forgetDrops();
  const table = Drop("drop_shared_kind_name").table().declareInto("migrations");
  const index = Drop("drop_shared_kind_name").index().declareInto("migrations");

  expect(table, equals({ kind: "table", name: "drop_shared_kind_name", table: undefined, cascade: false }));
  expect(index, equals({ kind: "index", name: "drop_shared_kind_name", table: undefined, cascade: false }));
});

Scribe.test("cascade is off unless called, and reflected on the declared drop once it is", () => {
  forgetDrops();
  const uncascaded = Drop("drop_no_cascade").table().declareInto("migrations");
  const cascaded = (new DropDeclaration("table", "drop_with_cascade")).cascade().declareInto("migrations");

  expect(uncascaded.cascade, equals(false));
  expect(cascaded.cascade, equals(true));
});

Scribe.test("declaredDrops filters by the moment it was declared for", () => {
  forgetDrops();
  Drop("drop_moment_migrations").table().declareInto("migrations");
  Drop("drop_moment_init").table().declareInto("init");

  const migrations = declaredDrops("migrations").map((drop) => drop.name);
  const init = declaredDrops("init").map((drop) => drop.name);

  expect(migrations.includes("drop_moment_migrations"), equals(true));
  expect(migrations.includes("drop_moment_init"), equals(false));
  expect(init.includes("drop_moment_init"), equals(true));
});

Scribe.test("forgetDrops empties every kind and every moment at once", () => {
  forgetDrops();
  Drop("drop_forget_me").table().declareInto("migrations");

  forgetDrops();

  expect(declaredDrops("migrations"), equals([]));
  Drop("drop_forget_me").table().declareInto("migrations");
});
