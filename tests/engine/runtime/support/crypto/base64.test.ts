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

import { fromBase64, fromBase64Url, jsonFromBase64Url } from "@scribe/runtime/support/crypto/base64.ts";
import { jwtPayloadUnverified } from "@scribe/runtime/support/crypto/jwt_payload.ts";
import { assert, assertEquals } from "@std/assert";

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.test("fromBase64Url decodes without the padding a JWT segment never carries", () => {
  assertEquals(
    new TextDecoder().decode(fromBase64Url(base64Url("hello"))!),
    "hello",
  );
  assertEquals(
    new TextDecoder().decode(fromBase64Url(base64Url("a"))!),
    "a",
  );
  assertEquals(
    new TextDecoder().decode(fromBase64Url(base64Url("ab"))!),
    "ab",
  );
});

Deno.test("fromBase64Url reads the two characters standard base64 does not have", () => {
  const bytes = new Uint8Array([0xff, 0xfe, 0xfd, 0x03, 0xef]);
  const standard = btoa(String.fromCharCode(...bytes));
  const urlSafe = standard
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  assert(
    urlSafe.includes("-") || urlSafe.includes("_"),
    "this sample must actually exercise the url-safe alphabet",
  );
  assertEquals(Array.from(fromBase64Url(urlSafe)!), Array.from(bytes));
});

Deno.test("fromBase64Url yields null instead of throwing on garbage", () => {
  assertEquals(fromBase64Url("not base64 at all !!"), null);
});

Deno.test("fromBase64Url refuses the standard spelling of the same bytes", () => {
  const standard = btoa(String.fromCharCode(0xff, 0xfe, 0xfd, 0x03, 0xef));

  assert(/[+/=]/.test(standard), "this sample must actually carry a character the url alphabet drops");
  assertEquals(fromBase64Url(standard), null);
});

Deno.test("fromBase64 reads the padded alphabet a webhook secret arrives in", () => {
  const bytes = new Uint8Array([0xff, 0xfe, 0xfd, 0x03, 0xef]);
  const standard = btoa(String.fromCharCode(...bytes));

  assertEquals(Array.from(fromBase64(standard)!), Array.from(bytes));
});

Deno.test("fromBase64 yields null instead of throwing on garbage", () => {
  assertEquals(fromBase64("not base64 at all !!"), null);
});

Deno.test("jsonFromBase64Url yields null on both failure modes", () => {
  assertEquals(jsonFromBase64Url(base64Url('{"a":1}')), { a: 1 });
  assertEquals(jsonFromBase64Url(base64Url("not json")), null);
  assertEquals(jsonFromBase64Url("!!!"), null);
});

Deno.test("jwtPayloadUnverified reads the claims of a well-formed token", () => {
  const token = [
    base64Url(JSON.stringify({ alg: "HS256" })),
    base64Url(JSON.stringify({ session_id: "s-1", sub: "u-1" })),
    "signature",
  ].join(".");

  assertEquals(jwtPayloadUnverified(token), {
    session_id: "s-1",
    sub: "u-1",
  });
});

Deno.test("jwtPayloadUnverified refuses anything that is not three segments", () => {
  const payload = base64Url(JSON.stringify({ sub: "u-1" }));

  assertEquals(jwtPayloadUnverified(payload), null);
  assertEquals(jwtPayloadUnverified(`header.${payload}`), null);
  assertEquals(jwtPayloadUnverified(`h.${payload}.sig.extra`), null);
});

Deno.test("jwtPayloadUnverified refuses a payload that is not a JSON object", () => {
  assertEquals(jwtPayloadUnverified(`h.${base64Url("42")}.sig`), null);
  assertEquals(jwtPayloadUnverified(`h.${base64Url('"text"')}.sig`), null);
  assertEquals(jwtPayloadUnverified("h.!!!.sig"), null);
});
