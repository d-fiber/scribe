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
import { equals, expect, isNull, Scribe } from "@scribe/alchemy/test";
import { ColumnFactory, columnsOf } from "@scribe/alchemy";

function columnOf(build: (c: ColumnFactory) => Record<string, unknown>) {
  const factory = new ColumnFactory();
  const map = build(factory) as Parameters<typeof columnsOf>[0];
  return columnsOf(map).field;
}

Scribe.test("a uuid column carries the bare kind and every flag off", () => {
  const column = columnOf((c) => ({ field: c.uuid() }));

  expect(column.type, equals({ kind: "uuid" }));
  expect(column.notNull, equals(false));
  expect(column.isPrimary, equals(false));
  expect(column.unique, equals(false));
  expect(column.nullsNotDistinct, equals(false));
  expect(column.collation, isNull);
  expect(column.defaultSql, isNull);
  expect(column.references, isNull);
  expect(column.identity, isNull);
  expect(column.generated, isNull);
});

Scribe.test("a boolean column falls through the switch's default branch, kept to its bare kind", () => {
  const column = columnOf((c) => ({ field: c.boolean() }));

  expect(column.type, equals({ kind: "boolean" }));
});

Scribe.test("varchar carries its length in the resolved type", () => {
  const column = columnOf((c) => ({ field: c.varchar(320) }));

  expect(column.type, equals({ kind: "varchar", length: 320 }));
});

Scribe.test("char carries its length in the resolved type", () => {
  const column = columnOf((c) => ({ field: c.char(3) }));

  expect(column.type, equals({ kind: "char", length: 3 }));
});

Scribe.test("numeric carries its precision and scale, both left undefined when omitted", () => {
  const bare = columnOf((c) => ({ field: c.numeric() }));
  expect(bare.type, equals({ kind: "numeric", precision: undefined, scale: undefined }));

  const bounded = columnOf((c) => ({ field: c.numeric(10, 2) }));
  expect(bounded.type, equals({ kind: "numeric", precision: 10, scale: 2 }));
});

Scribe.test("bit carries its length, left undefined when omitted", () => {
  const bare = columnOf((c) => ({ field: c.bit() }));
  expect(bare.type, equals({ kind: "bit", length: undefined }));

  const sized = columnOf((c) => ({ field: c.bit(4) }));
  expect(sized.type, equals({ kind: "bit", length: 4 }));
});

Scribe.test("varbit carries its length, left undefined when omitted", () => {
  const column = columnOf((c) => ({ field: c.varbit(16) }));

  expect(column.type, equals({ kind: "varbit", length: 16 }));
});

Scribe.test("time carries its precision and time zone flag", () => {
  const column = columnOf((c) => ({ field: c.time({ precision: 3, withTimeZone: true }) }));

  expect(column.type, equals({ kind: "time", precision: 3, withTimeZone: true }));
});

Scribe.test("timestamp carries its precision and time zone flag", () => {
  const column = columnOf((c) => ({ field: c.timestamp({ withTimeZone: true }) }));

  expect(column.type, equals({ kind: "timestamp", precision: undefined, withTimeZone: true }));
});

Scribe.test("interval carries its fields and precision", () => {
  const column = columnOf((c) => ({ field: c.interval({ fields: "day to second", precision: 2 }) }));

  expect(column.type, equals({ kind: "interval", fields: "day to second", precision: 2 }));
});

Scribe.test("range carries its subtype and multirange flag", () => {
  const single = columnOf((c) => ({ field: c.range("integer") }));
  expect(single.type, equals({ kind: "range", of: "integer", multirange: undefined }));

  const multi = columnOf((c) => ({ field: c.range("timestamptz", true) }));
  expect(multi.type, equals({ kind: "range", of: "timestamptz", multirange: true }));
});

Scribe.test("enum carries the name it points at", () => {
  const column = columnOf((c) => ({ field: c.enum("booking_status") }));

  expect(column.type, equals({ kind: "enum", name: "booking_status" }));
});

Scribe.test("composite carries the name it points at", () => {
  const column = columnOf((c) => ({ field: c.composite("location_coordinate") }));

  expect(column.type, equals({ kind: "composite", name: "location_coordinate" }));
});

Scribe.test("array wraps the resolved base type rather than replacing it", () => {
  const column = columnOf((c) => ({ field: c.integer().array() }));

  expect(column.type, equals({ kind: "array", of: { kind: "integer" } }));
});

Scribe.test("isPrimary sets both isPrimary and notNull, without isNullable being touched", () => {
  const column = columnOf((c) => ({ field: c.uuid().isPrimary() }));

  expect(column.isPrimary, equals(true));
  expect(column.notNull, equals(true));
});

Scribe.test("isNullable(false) sets notNull without setting isPrimary", () => {
  const column = columnOf((c) => ({ field: c.text().isNullable(false) }));

  expect(column.notNull, equals(true));
  expect(column.isPrimary, equals(false));
});

Scribe.test("isNullable() with no argument defaults to true, which leaves notNull false", () => {
  const column = columnOf((c) => ({ field: c.text().isNullable() }));

  expect(column.notNull, equals(false));
});

Scribe.test("collation is carried only by a collatable column, and stays null on every other type", () => {
  const collatable = columnOf((c) => ({ field: c.text().collation("und-x-icu") }));
  expect(collatable.collation, equals("und-x-icu"));

  const varchar = columnOf((c) => ({ field: c.varchar(10).collation("C") }));
  expect(varchar.collation, equals("C"));

  const notCollatable = columnOf((c) => ({ field: c.integer() }));
  expect(notCollatable.collation, isNull);
});

Scribe.test("identity is carried only by an identity-capable column, and stays null on every other type", () => {
  const identity = columnOf((c) => ({ field: c.bigint().identity({ startWith: 1000 }) }));
  expect(identity.identity, equals({ startWith: 1000 }));

  const defaulted = columnOf((c) => ({ field: c.smallint().identity() }));
  expect(defaulted.identity, equals({}));

  const notIdentityCapable = columnOf((c) => ({ field: c.text() }));
  expect(notIdentityCapable.identity, isNull);
});

Scribe.test("references defaults its column to id when none is given, and keeps the one given otherwise", () => {
  const defaulted = columnOf((c) => ({ field: c.uuid().references({ table: "accounts" }) }));
  expect(defaulted.references, equals({ table: "accounts", column: "id" }));

  const named = columnOf((c) => ({ field: c.uuid().references({ table: "accounts", column: "uid" }) }));
  expect(named.references, equals({ table: "accounts", column: "uid" }));
});

Scribe.test("default carries its raw SQL through as defaultSql", () => {
  const column = columnOf((c) => ({ field: c.timestamp().default("now()") }));

  expect(column.defaultSql, equals("now()"));
});

Scribe.test("unique and nullsNotDistinct are carried independently of one another", () => {
  const column = columnOf((c) => ({ field: c.text().unique().nullsNotDistinct() }));

  expect(column.unique, equals(true));
  expect(column.nullsNotDistinct, equals(true));
});

Scribe.test("generated is carried through unchanged", () => {
  const column = columnOf((c) => ({
    field: c.text().generated({ expression: "lower(email)", storage: "stored" }),
  }));

  expect(column.generated, equals({ expression: "lower(email)", storage: "stored" }));
});

Scribe.test("columnsOf resolves every field of the map, by field name", () => {
  const c = new ColumnFactory();
  const columns = columnsOf({
    id: c.uuid().isPrimary(),
    status: c.enum("booking_status"),
  });

  expect(Object.keys(columns), equals(["id", "status"]));
  expect(columns.id.isPrimary, equals(true));
  expect(columns.status.type, equals({ kind: "enum", name: "booking_status" }));
});
