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
import { allOf, contains, equals, expect, isA, Scribe, throwsA, withMessage } from "@scribe/alchemy/test";
import {
  declaredIndexes,
  declaredPolicies,
  declaredTables,
  DuplicateDeclarationError,
  forgetIndexes,
  forgetPolicies,
  forgetTables,
  Table,
} from "@scribe/alchemy";

Scribe.test("columns refuses a composite primaryKey alongside a column-level isPrimary", () => {
  forgetTables();

  expect(
    () =>
      Table("table_pk_conflict")
        .primaryKey((pk) => pk.columns(["account_id", "device_id"]))
        .columns((c) => ({
          accountId: c.uuid().isPrimary(),
          deviceId: c.uuid(),
        })),
    throwsA(allOf(isA(Error), withMessage("names a composite primary key and also carries a column-level"))),
  );
});

Scribe.test("a composite primaryKey without a conflicting column is accepted", () => {
  forgetTables();

  const entry = Table("table_pk_composite")
    .primaryKey((pk) => pk.columns(["account_id", "device_id"]))
    .columns((c) => ({ accountId: c.uuid(), deviceId: c.uuid() }));
  const declared = entry.declareInto("init");

  expect(
    declared.primaryKey,
    equals({
      columns: ["account_id", "device_id"],
      name: undefined,
      include: undefined,
      deferrable: undefined,
      initiallyDeferred: undefined,
    }),
  );
});

Scribe.test("a table name declared twice, even across two different moments, is refused", () => {
  forgetTables();
  Table("table_name_conflict").columns((c) => ({ id: c.uuid().isPrimary() })).declareInto("init");

  expect(
    () => Table("table_name_conflict").columns((c) => ({ id: c.uuid().isPrimary() })).declareInto("migrations"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('table "table_name_conflict" is declared twice'))),
  );
});

Scribe.test("an index name declared twice, on two different tables, is refused across the whole package", () => {
  forgetTables();
  forgetIndexes();
  Table("table_index_owner_a")
    .indexes((i) => [i.name("shared_index_name").columns(["a"])])
    .columns((c) => ({ a: c.uuid() }))
    .declareInto("init");

  expect(
    () =>
      Table("table_index_owner_b")
        .indexes((i) => [i.name("shared_index_name").columns(["b"])])
        .columns((c) => ({ b: c.uuid() }))
        .declareInto("init"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('index "shared_index_name" is declared twice'))),
  );
});

Scribe.test("a policy name declared twice, on two different tables, is refused across the whole package", () => {
  forgetTables();
  forgetPolicies();
  Table("table_policy_owner_a")
    .policies((p) => [p.name("shared_policy_name").for("select")])
    .columns((c) => ({ a: c.uuid() }))
    .declareInto("init");

  expect(
    () =>
      Table("table_policy_owner_b")
        .policies((p) => [p.name("shared_policy_name").for("select")])
        .columns((c) => ({ b: c.uuid() }))
        .declareInto("init"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('policy "shared_policy_name" is declared twice'))),
  );
});

Scribe.test("declaredTables only answers the moment it was asked about", () => {
  forgetTables();
  Table("table_moment_init").columns((c) => ({ id: c.uuid().isPrimary() })).declareInto("init");
  Table("table_moment_migrations").columns((c) => ({ id: c.uuid().isPrimary() })).declareInto("migrations");

  const init = declaredTables("init").map((table) => table.name);
  const migrations = declaredTables("migrations").map((table) => table.name);

  expect(init, contains("table_moment_init"));
  expect(migrations, contains("table_moment_migrations"));
  expect(init.includes("table_moment_migrations"), equals(false));
});

Scribe.test("an index declares under the table's own moment, resolved with the table's own name", () => {
  forgetTables();
  forgetIndexes();
  Table("table_index_moment")
    .indexes((i) => [i.name("table_index_moment_name_idx").columns(["email"])])
    .columns((c) => ({ email: c.text() }))
    .declareInto("provisioning");

  const indexes = declaredIndexes("provisioning").filter((index) => index.name === "table_index_moment_name_idx");

  expect(
    indexes,
    equals([{
      name: "table_index_moment_name_idx",
      options: {
        table: "table_index_moment",
        columns: ["email"],
        unique: undefined,
        nullsNotDistinct: undefined,
        using: undefined,
        include: undefined,
        fillfactor: undefined,
        where: undefined,
      },
    }]),
  );
});

Scribe.test("a policy declares under the table's own moment, resolved with the table's own name", () => {
  forgetTables();
  forgetPolicies();
  Table("table_policy_moment")
    .policies((p) => [p.name("table_policy_moment_self").for("select").using("account_id = auth.uid()")])
    .columns((c) => ({ accountId: c.uuid() }))
    .declareInto("migrations");

  const policies = declaredPolicies("migrations").filter((policy) => policy.name === "table_policy_moment_self");

  expect(
    policies,
    equals([{
      name: "table_policy_moment_self",
      options: {
        table: "table_policy_moment",
        for: "select",
        as: undefined,
        to: undefined,
        using: "account_id = auth.uid()",
        withCheck: undefined,
      },
    }]),
  );
});

Scribe.test("a table's grant is filled in with the table it sits on, as kind table", () => {
  forgetTables();
  const declared = Table("table_with_grant")
    .grants((g) => [g.privileges(["select"]).to(["authenticated"])])
    .columns((c) => ({ id: c.uuid().isPrimary() }))
    .declareInto("init");

  expect(declared.name, equals("table_with_grant"));
});

Scribe.test("forgetTables, forgetIndexes and forgetPolicies each empty their own registry only", () => {
  forgetTables();
  forgetIndexes();
  forgetPolicies();
  Table("table_forget_isolated")
    .indexes((i) => [i.name("table_forget_isolated_idx").columns(["a"])])
    .policies((p) => [p.name("table_forget_isolated_policy").for("select")])
    .columns((c) => ({ a: c.uuid() }))
    .declareInto("init");

  forgetTables();

  expect(declaredTables("init").some((table) => table.name === "table_forget_isolated"), equals(false));
  expect(declaredIndexes("init").some((index) => index.name === "table_forget_isolated_idx"), equals(true));
  expect(declaredPolicies("init").some((policy) => policy.name === "table_forget_isolated_policy"), equals(true));

  forgetIndexes();
  forgetPolicies();
});
