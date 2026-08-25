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

import { equals, expect } from "@scribe/alchemy/test";
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

Deno.test("a text field left out is absent rather than empty", () => {
  expect(parseBodyBytes({ note: String }, sent({})), equals({ note: null }));
});

Deno.test("a text field sent empty is empty, and says so apart from being left out", () => {
  expect(parseBodyBytes({ note: String }, sent({ note: "" })), equals({ note: "" }));
});

Deno.test("a text field sent as something other than text is absent, not silently emptied", () => {
  expect(parseBodyBytes({ note: String }, sent({ note: 42 })), equals({ note: null }));
});

Deno.test("a mandatory text sent empty is what the caller meant, and is taken", () => {
  expect(parseBodyBytes({ note: Required(String) }, sent({ note: "" })), equals({ note: "" }));
});

Deno.test("a mandatory text left out refuses the body", () => {
  expect(parseBodyBytes({ note: Required(String) }, sent({})), equals(null));
});

Deno.test("a mandatory text sent as a number refuses the body", () => {
  expect(parseBodyBytes({ note: Required(String) }, sent({ note: 42 })), equals(null));
});

Deno.test("text is read with its surrounding blanks taken off", () => {
  expect(parseBodyBytes({ note: String }, sent({ note: "  ada  " })), equals({ note: "ada" }));
});

Deno.test("a list refuses the whole body when one of its items is not what it says", () => {
  expect(parseBodyBytes({ counts: ListOf(Number) }, sent({ counts: [1, "x", 3] })), equals({ counts: null }));
});

Deno.test("a list of the right items is read item by item", () => {
  expect(parseBodyBytes({ counts: ListOf(Number) }, sent({ counts: [1, 2, 3] })), equals({ counts: [1, 2, 3] }));
});

Deno.test("a nested shape is read against what it declares", () => {
  const read = parseBodyBytes(
    { brand: Required(Nested({ id: Required(String), note: String })) },
    sent({ brand: { id: "ada" } }),
  );

  expect(read, equals({ brand: { id: "ada", note: null } }));
});

Deno.test("a body that is not JSON at all is refused rather than half read", () => {
  expect(parseBodyBytes({ note: String }, new TextEncoder().encode("{ not json")), equals(null));
});

Deno.test("no body at all is refused when anything was declared mandatory", () => {
  expect(parseBodyBytes({ note: Required(String) }, null), equals(null));
});

Deno.test("a form reads a name sent twice as a list", async () => {
  const form = await filled([["tags", "a"], ["tags", "b"]]);

  expect(await parseFormBytes({ tags: ListOf(String) }, form.bytes, form.contentType), equals({ tags: ["a", "b"] }));
});

Deno.test("a form carries a list of shapes as JSON in one field", async () => {
  const form = await filled([["members", '[{"id":"a"},{"id":"b"}]']]);

  expect(
    await parseFormBytes({ members: ListOf(Nested({ id: Required(String) })) }, form.bytes, form.contentType),
    equals({ members: [{ id: "a" }, { id: "b" }] }),
  );
});

Deno.test("a form field holding text that is not JSON answers nothing rather than throwing", async () => {
  const form = await filled([["members", "{ not json"]]);

  expect(
    await parseFormBytes({ members: ListOf(Nested({ id: String })) }, form.bytes, form.contentType),
    equals({ members: null }),
  );
});

Deno.test("a mandatory form field left out refuses the form", async () => {
  const form = await filled([["other", "x"]]);

  expect(await parseFormBytes({ name: Required(String) }, form.bytes, form.contentType), equals(null));
});

Deno.test("a mandatory form field sent empty is taken, as it is on a body", async () => {
  const form = await filled([["name", ""]]);

  expect(await parseFormBytes({ name: Required(String) }, form.bytes, form.contentType), equals({ name: "" }));
});

Deno.test("a file sent through a form is carried untouched", async () => {
  const form = await filled([["avatar", new File(["x"], "avatar.png", { type: "image/png" })]]);

  const read = await parseFormBytes({ avatar: Required(File) }, form.bytes, form.contentType);

  expect(read?.avatar.name, equals("avatar.png"));
});
