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
import { contains, equals, expect, having, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { HttpRequest } from "@scribe/alchemy/http";

Scribe.test("bodyBytes, body and bodyFields each replace what the other two wrote", () => {
  const request = new HttpRequest("POST", "https://example.test/one");

  request.bodyBytes = new TextEncoder().encode("raw");
  expect(request.body, equals("raw"), "setting bodyBytes did not change what body reads back");

  request.body = "text";
  expect(request.bodyBytes, equals(new TextEncoder().encode("text")), "setting body did not change bodyBytes");

  request.bodyFields = { name: "ada" };
  expect(request.body, equals("name=ada"), "setting bodyFields did not change what body reads back");
});

Scribe.test("setting body also sets a text content-type when none was set yet", () => {
  const request = new HttpRequest("POST", "https://example.test/one");
  request.body = "hello";

  expect(request.headers.get("content-type"), equals("text/plain; charset=utf-8"));
});

Scribe.test("setting body does not override a content-type already set", () => {
  const request = new HttpRequest("POST", "https://example.test/one");
  request.headers.set("content-type", "application/vnd.custom+text");
  request.body = "hello";

  expect(request.headers.get("content-type"), equals("application/vnd.custom+text"));
});

Scribe.test("bodyFields sets the form content-type, and reading it back gives the same fields", () => {
  const request = new HttpRequest("POST", "https://example.test/one");
  request.bodyFields = { name: "ada", role: "editor" };

  expect(request.headers.get("content-type"), equals("application/x-www-form-urlencoded; charset=utf-8"));
  expect(request.bodyFields, equals({ name: "ada", role: "editor" }));
});

Scribe.test("reading bodyFields on a request whose content-type is not a form is refused", () => {
  const request = new HttpRequest("POST", "https://example.test/one");
  request.body = "not a form";

  expect(
    () => request.bodyFields,
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("content-type"))),
  );
});

Scribe.test("contentLength always answers the exact length of the body already in hand", () => {
  const request = new HttpRequest("POST", "https://example.test/one");
  request.body = "12345";

  expect(request.contentLength, equals(5));
});

Scribe.test("finalize hands back the body that was already set, unchanged", async () => {
  const request = new HttpRequest("POST", "https://example.test/one");
  request.body = "hello";

  const finalized = await request.finalize().toBytes();
  expect(finalized, equals(new TextEncoder().encode("hello")));
});
