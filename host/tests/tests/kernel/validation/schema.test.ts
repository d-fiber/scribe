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

import { applyBodySchema } from "@scribe/core/kernel/validation/body_schema_parser.ts";
import { applyFormSchema } from "@scribe/core/kernel/validation/form_schema_parser.ts";
import {
  Arr,
  Nested,
  Required,
} from "@scribe/core/kernel/validation/schema.ts";
import { assertEquals } from "@std/assert";

function formOf(entries: [string, string | File][]): FormData {
  const form = new FormData();
  for (const [key, value] of entries) form.append(key, value);
  return form;
}

Deno.test("an absent optional scalar lands as null, not as undefined", () => {
  assertEquals(applyBodySchema({ name: String, age: Number }, {}), {
    name: "",
    age: null,
  });
});

Deno.test("a missing required field refuses the whole body", () => {
  const schema = { name: Required(String), age: Number };

  assertEquals(applyBodySchema(schema, { age: 30 }), null);
  assertEquals(applyBodySchema(schema, { name: "  ", age: 30 }), null);
  assertEquals(applyBodySchema(schema, { name: "ana", age: 30 }), {
    name: "ana",
    age: 30,
  });
});

Deno.test("a required number accepts zero, which is a value and not an absence", () => {
  assertEquals(applyBodySchema({ count: Required(Number) }, { count: 0 }), {
    count: 0,
  });
});

Deno.test("a required boolean accepts false", () => {
  assertEquals(applyBodySchema({ flag: Required(Boolean) }, { flag: false }), {
    flag: false,
  });
});

Deno.test("a scalar array keeps its items and refuses what is not an array", () => {
  assertEquals(applyBodySchema({ tags: Arr(String) }, { tags: ["a", "b"] }), {
    tags: ["a", "b"],
  });
  assertEquals(applyBodySchema({ tags: Arr(String) }, { tags: "a" }), {
    tags: null,
  });
});

Deno.test("a nested schema is applied in depth", () => {
  const schema = { owner: Nested({ id: Required(String), age: Number }) };

  assertEquals(applyBodySchema(schema, { owner: { id: "u1", age: 30 } }), {
    owner: { id: "u1", age: 30 },
  });
  assertEquals(applyBodySchema(schema, { owner: { age: 30 } }), {
    owner: null,
  });
});

Deno.test("an array of nested schemas is applied item by item", () => {
  const schema = { members: Arr(Nested({ id: Required(String) })) };

  assertEquals(
    applyBodySchema(schema, { members: [{ id: "a" }, { id: "b" }] }),
    { members: [{ id: "a" }, { id: "b" }] },
  );
});

Deno.test("a form reads a repeated key as an array", () => {
  assertEquals(
    applyFormSchema({ tags: Arr(String) }, formOf([["tags", "a"], ["tags", "b"]])),
    { tags: ["a", "b"] },
  );
});

Deno.test("a form carries an array of nested schemas as json in one field", () => {
  assertEquals(
    applyFormSchema(
      { members: Arr(Nested({ id: Required(String) })) },
      formOf([["members", '[{"id":"a"},{"id":"b"}]']]),
    ),
    { members: [{ id: "a" }, { id: "b" }] },
  );
});

Deno.test("a form field holding invalid json yields null rather than throwing", () => {
  assertEquals(
    applyFormSchema(
      { members: Arr(Nested({ id: String })) },
      formOf([["members", "{ not json"]]),
    ),
    { members: null },
  );
});

Deno.test("a required form field applies the same rule as a body one", () => {
  const schema = { name: Required(String) };

  assertEquals(applyFormSchema(schema, formOf([])), null);
  assertEquals(applyFormSchema(schema, formOf([["name", ""]])), null);
  assertEquals(applyFormSchema(schema, formOf([["name", "ana"]])), {
    name: "ana",
  });
});

Deno.test("a form file field is carried through untouched", () => {
  const file = new File(["x"], "avatar.png", { type: "image/png" });
  const parsed = applyFormSchema(
    { avatar: Required(File) },
    formOf([["avatar", file]]),
  );

  assertEquals(parsed?.avatar.name, "avatar.png");
});
