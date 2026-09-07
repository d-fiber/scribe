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
import { equals, expect, Scribe } from "@scribe/alchemy/test";
import { dbSchema, declaredEnums, declaredTables, forgetEnums, forgetTables, Table } from "@scribe/alchemy";

Scribe.test("init, migrations and provisioning each open a batch bound to their own moment", () => {
  forgetTables();
  forgetEnums();

  dbSchema.init().with((w) => [
    w.enum("schema_batch_status").value("open"),
    w.table("schema_batch_table").columns((c) => ({ id: c.uuid().isPrimary() })),
  ]);

  expect(declaredTables("init").some((table) => table.name === "schema_batch_table"), equals(true));
  expect(declaredTables("migrations").some((table) => table.name === "schema_batch_table"), equals(false));
  expect(declaredEnums("init").some((entry) => entry.name === "schema_batch_status"), equals(true));
});

Scribe.test("with declares every entry the callback answers, in the order it lists them", () => {
  forgetTables();

  dbSchema.migrations().with((w) => [
    w.table("schema_with_order_a").columns((c) => ({ id: c.uuid().isPrimary() })),
    w.table("schema_with_order_b").columns((c) => ({ id: c.uuid().isPrimary() })),
  ]);

  const names = declaredTables("migrations").map((table) => table.name);
  expect(names.indexOf("schema_with_order_a") < names.indexOf("schema_with_order_b"), equals(true));
});

Scribe.test("a table built but never listed in with is never declared", () => {
  forgetTables();
  Table("schema_never_listed_table").columns((c) => ({ id: c.uuid().isPrimary() }));

  expect(declaredTables("provisioning").some((table) => table.name === "schema_never_listed_table"), equals(false));
});
