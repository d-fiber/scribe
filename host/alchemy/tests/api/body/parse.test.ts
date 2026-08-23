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

import { equals, expect } from "../../../src/test/mod.ts";
import { parseBodyBytes } from "../../../src/api/body/parse.ts";
import { ListOf, Nested, Required } from "../../../src/api/body/markers.ts";

function sent(body: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(body));
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
