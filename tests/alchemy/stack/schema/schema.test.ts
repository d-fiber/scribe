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
import type { EnumBuilder, SchemaNode } from "@scribe/alchemy";
import {
  declaredEnums,
  declaredTables,
  DuplicateDeclarationError,
  Enum,
  forgetSchemas,
  Schema,
  SchemaInit,
  SchemaMigration,
  SchemaProvisioning,
  Table,
} from "@scribe/alchemy";

Scribe.test("two different @Schema classes each contribute their own table", () => {
  forgetSchemas();

  @Schema()
  class AccountsFile {
    @SchemaInit()
    accounts(): readonly SchemaNode[] {
      return Table("schema_accounts").columns((c) => ({ id: c.uuid().isPrimary() }));
    }
  }
  void AccountsFile;

  @Schema()
  class BookingsFile {
    @SchemaInit()
    bookings(): readonly SchemaNode[] {
      return Table("schema_bookings").columns((c) => ({ id: c.uuid().isPrimary() }));
    }
  }
  void BookingsFile;

  const names = declaredTables("init").map((table) => table.name);
  expect(names.includes("schema_accounts"), equals(true));
  expect(names.includes("schema_bookings"), equals(true));
});

Scribe.test("two different @Schema classes declaring the same table name collide", () => {
  forgetSchemas();

  @Schema()
  class FirstFile {
    @SchemaInit()
    widgets(): readonly SchemaNode[] {
      return Table("schema_cross_file_conflict").columns((c) => ({ id: c.uuid().isPrimary() }));
    }
  }
  void FirstFile;

  @Schema()
  class SecondFile {
    @SchemaMigration()
    widgets(): readonly SchemaNode[] {
      return Table("schema_cross_file_conflict").columns((c) => ({ id: c.uuid().isPrimary() }));
    }
  }
  void SecondFile;

  expect(
    () => declaredTables("init"),
    throwsA(allOf(isA(DuplicateDeclarationError), withMessage('table "schema_cross_file_conflict" is declared twice'))),
  );
});

Scribe.test("one class mixing the three moments answers each moment only what it declared for it", () => {
  forgetSchemas();

  @Schema()
  class BookingSchema {
    @SchemaInit()
    status(): EnumBuilder {
      return Enum("schema_booking_status").value("pending").value("confirmed");
    }

    @SchemaInit()
    bookings(): readonly SchemaNode[] {
      return Table("schema_bookings_mixed").columns((c) => ({ id: c.uuid().isPrimary() }));
    }

    @SchemaMigration()
    devices(): readonly SchemaNode[] {
      return Table("schema_devices_mixed").columns((c) => ({ id: c.uuid().isPrimary() }));
    }

    @SchemaProvisioning()
    trigram(): SchemaNode {
      return Table("schema_never_a_table").columns((c) => ({ id: c.uuid() }))[0];
    }
  }
  void BookingSchema;

  expect(declaredEnums("init").map((e) => e.name), equals(["schema_booking_status"]));
  expect(declaredTables("init").map((t) => t.name), equals(["schema_bookings_mixed"]));
  expect(declaredTables("migrations").map((t) => t.name), equals(["schema_devices_mixed"]));
  expect(declaredTables("provisioning").map((t) => t.name), equals(["schema_never_a_table"]));
});

Scribe.test("a value built but never answered by a decorated method is never declared", () => {
  forgetSchemas();

  Table("schema_never_wired").columns((c) => ({ id: c.uuid().isPrimary() }));

  @Schema()
  class NothingDeclared {}
  void NothingDeclared;

  expect(declaredTables("init").some((table) => table.name === "schema_never_wired"), equals(false));
});

Scribe.test("forgetSchemas empties every bucket at once", () => {
  forgetSchemas();

  @Schema()
  class ForgetMe {
    @SchemaInit()
    table(): readonly SchemaNode[] {
      return Table("schema_forget_me").columns((c) => ({ id: c.uuid().isPrimary() }));
    }
  }
  void ForgetMe;

  expect(declaredTables("init").some((table) => table.name === "schema_forget_me"), equals(true));

  forgetSchemas();

  expect(declaredTables("init"), equals([]));
});
