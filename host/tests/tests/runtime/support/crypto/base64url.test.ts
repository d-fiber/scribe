// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import {
  fromBase64Url,
  jsonFromBase64Url,
} from "@scribe/core/runtime/support/crypto/base64url.ts";
import { jwtPayloadUnverified } from "@scribe/core/runtime/support/crypto/jwt_payload.ts";
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

Deno.test("jsonFromBase64Url yields null on both failure modes", () => {
  assertEquals(jsonFromBase64Url(base64Url("{\"a\":1}")), { a: 1 });
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
  assertEquals(jwtPayloadUnverified(`h.${base64Url("\"text\"")}.sig`), null);
  assertEquals(jwtPayloadUnverified("h.!!!.sig"), null);
});
