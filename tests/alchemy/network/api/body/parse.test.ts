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
import { parseBodyBytes, parseFormBytes } from "@scribe/alchemy/body";
import { ListOf, Nested, Required } from "@scribe/alchemy/body";

function sent(body: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(body));
}

interface SentForm {
  bytes: Uint8Array;
  contentType: string;
}

async function filled(entries: [string, string | File][]): Promise<SentForm> {
  const form = new FormData();
  for (const [name, value] of entries) form.append(name, value);

  const carrier = new Response(form);

  return {
    bytes: new Uint8Array(await carrier.arrayBuffer()),
    contentType: carrier.headers.get("content-type") ?? "",
  };
}

Scribe.test("a text field left out is absent rather than empty", () => {
  expect(parseBodyBytes({ note: String }, sent({})), equals({ note: null }));
});

Scribe.test("a text field sent empty is empty, and says so apart from being left out", () => {
  expect(parseBodyBytes({ note: String }, sent({ note: "" })), equals({ note: "" }));
});

Scribe.test("a text field sent as something other than text is absent, not silently emptied", () => {
  expect(parseBodyBytes({ note: String }, sent({ note: 42 })), equals({ note: null }));
});

Scribe.test("a mandatory text sent empty is what the caller meant, and is taken", () => {
  expect(parseBodyBytes({ note: Required(String) }, sent({ note: "" })), equals({ note: "" }));
});

Scribe.test("a mandatory text left out refuses the body", () => {
  expect(parseBodyBytes({ note: Required(String) }, sent({})), equals(null));
});

Scribe.test("a mandatory text sent as a number refuses the body", () => {
  expect(parseBodyBytes({ note: Required(String) }, sent({ note: 42 })), equals(null));
});

Scribe.test("text is read with its surrounding blanks taken off", () => {
  expect(parseBodyBytes({ note: String }, sent({ note: "  ada  " })), equals({ note: "ada" }));
});

Scribe.test("a list refuses the whole body when one of its items is not what it says", () => {
  expect(parseBodyBytes({ counts: ListOf(Number) }, sent({ counts: [1, "x", 3] })), equals({ counts: null }));
});

Scribe.test("a list of the right items is read item by item", () => {
  expect(parseBodyBytes({ counts: ListOf(Number) }, sent({ counts: [1, 2, 3] })), equals({ counts: [1, 2, 3] }));
});

Scribe.test("a nested shape is read against what it declares", () => {
  const read = parseBodyBytes(
    { brand: Required(Nested({ id: Required(String), note: String })) },
    sent({ brand: { id: "ada" } }),
  );

  expect(read, equals({ brand: { id: "ada", note: null } }));
});

Scribe.test("a body that is not JSON at all is refused rather than half read", () => {
  expect(parseBodyBytes({ note: String }, new TextEncoder().encode("{ not json")), equals(null));
});

Scribe.test("no body at all is refused when anything was declared mandatory", () => {
  expect(parseBodyBytes({ note: Required(String) }, null), equals(null));
});

Scribe.test("a form reads a name sent twice as a list", async () => {
  const form = await filled([["tags", "a"], ["tags", "b"]]);

  expect(await parseFormBytes({ tags: ListOf(String) }, form.bytes, form.contentType), equals({ tags: ["a", "b"] }));
});

Scribe.test("a form carries a list of shapes as JSON in one field", async () => {
  const form = await filled([["members", '[{"id":"a"},{"id":"b"}]']]);

  expect(
    await parseFormBytes({ members: ListOf(Nested({ id: Required(String) })) }, form.bytes, form.contentType),
    equals({ members: [{ id: "a" }, { id: "b" }] }),
  );
});

Scribe.test("a form field holding text that is not JSON answers nothing rather than throwing", async () => {
  const form = await filled([["members", "{ not json"]]);

  expect(
    await parseFormBytes({ members: ListOf(Nested({ id: String })) }, form.bytes, form.contentType),
    equals({ members: null }),
  );
});

Scribe.test("a mandatory form field left out refuses the form", async () => {
  const form = await filled([["other", "x"]]);

  expect(await parseFormBytes({ name: Required(String) }, form.bytes, form.contentType), equals(null));
});

Scribe.test("a mandatory form field sent empty is taken, as it is on a body", async () => {
  const form = await filled([["name", ""]]);

  expect(await parseFormBytes({ name: Required(String) }, form.bytes, form.contentType), equals({ name: "" }));
});

Scribe.test("a file sent through a form is carried untouched", async () => {
  const form = await filled([["avatar", new File(["x"], "avatar.png", { type: "image/png" })]]);

  const read = await parseFormBytes({ avatar: Required(File) }, form.bytes, form.contentType);

  expect(read?.avatar.name, equals("avatar.png"));
});

Scribe.test("a number field in a JSON body is taken as sent, without any parsing", () => {
  expect(parseBodyBytes({ age: Number }, sent({ age: 12 })), equals({ age: 12 }));
});

Scribe.test("a number field in a JSON body sent as text is refused rather than parsed", () => {
  expect(parseBodyBytes({ age: Number }, sent({ age: "12" })), equals({ age: null }));
});

Scribe.test("a boolean field in a JSON body is taken as sent, without any parsing", () => {
  expect(parseBodyBytes({ active: Boolean }, sent({ active: true })), equals({ active: true }));
});

Scribe.test("a boolean field in a JSON body sent as text is refused rather than parsed", () => {
  expect(parseBodyBytes({ active: Boolean }, sent({ active: "true" })), equals({ active: null }));
});

Scribe.test("an object field in a JSON body is kept as it arrived", () => {
  expect(parseBodyBytes({ config: Object }, sent({ config: { a: 1 } })), equals({ config: { a: 1 } }));
});

Scribe.test("an object field sent as a list is refused, since a list is not a plain object", () => {
  expect(parseBodyBytes({ config: Object }, sent({ config: [1, 2] })), equals({ config: null }));
});

Scribe.test("an object field sent as null is absent rather than an empty object", () => {
  expect(parseBodyBytes({ config: Object }, sent({ config: null })), equals({ config: null }));
});

Scribe.test("a list whose raw value is not an array at all is refused, not read as one item", () => {
  expect(parseBodyBytes({ counts: ListOf(Number) }, sent({ counts: 5 })), equals({ counts: null }));
});

Scribe.test("a number field in a form is parsed from its spelling", async () => {
  const form = await filled([["age", "12"]]);
  expect(await parseFormBytes({ age: Number }, form.bytes, form.contentType), equals({ age: 12 }));
});

Scribe.test("a number field in a form sent as something unparseable is refused", async () => {
  const form = await filled([["age", "not a number"]]);
  expect(await parseFormBytes({ age: Number }, form.bytes, form.contentType), equals({ age: null }));
});

Scribe.test("a boolean field in a form is read from the literal spelling true or false", async () => {
  const asTrue = await filled([["active", "true"]]);
  expect(await parseFormBytes({ active: Boolean }, asTrue.bytes, asTrue.contentType), equals({ active: true }));

  const asFalse = await filled([["active", "false"]]);
  expect(await parseFormBytes({ active: Boolean }, asFalse.bytes, asFalse.contentType), equals({ active: false }));
});

Scribe.test("a boolean field in a form sent as anything else is refused rather than guessed", async () => {
  const form = await filled([["active", "yes"]]);
  expect(await parseFormBytes({ active: Boolean }, form.bytes, form.contentType), equals({ active: null }));
});

Scribe.test("a list of files in a form keeps only the entries that are files", async () => {
  const first = new File(["a"], "a.png", { type: "image/png" });
  const second = new File(["b"], "b.png", { type: "image/png" });
  const form = await filled([["avatars", first], ["avatars", "not a file"], ["avatars", second]]);

  const read = await parseFormBytes({ avatars: ListOf(File) }, form.bytes, form.contentType);

  expect(read?.avatars?.map((file) => file.name), equals(["a.png", "b.png"]));
});

Scribe.test("a single nested field sent as JSON text in one form field is read against its shape", async () => {
  const form = await filled([["brand", '{"id":"a"}']]);

  const read = await parseFormBytes(
    { brand: Required(Nested({ id: Required(String) })) },
    form.bytes,
    form.contentType,
  );

  expect(read, equals({ brand: { id: "a" } }));
});

Scribe.test("a single nested field sent as text that is not JSON answers nothing rather than throwing", async () => {
  const form = await filled([["brand", "not json"]]);

  const read = await parseFormBytes(
    { brand: Required(Nested({ id: Required(String) })) },
    form.bytes,
    form.contentType,
  );

  expect(read, equals(null));
});

Scribe.test("a list of shapes sent as valid JSON that is not itself an array is refused", async () => {
  const form = await filled([["members", '{"id":"a"}']]);

  expect(
    await parseFormBytes({ members: ListOf(Nested({ id: Required(String) })) }, form.bytes, form.contentType),
    equals({ members: null }),
  );
});
