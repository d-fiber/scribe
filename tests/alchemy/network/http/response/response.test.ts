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
import { contains, equals, expect, expectLater, having, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { Bytes } from "@scribe/alchemy";
import { ByteStream, ClientException, HttpResponse, StreamedResponse } from "@scribe/alchemy/http";

Scribe.test("json parses a JSON body", () => {
  const response = new HttpResponse('{"id":"ada","age":30}', 200);
  expect(response.json(), equals({ id: "ada", age: 30 }));
});

Scribe.test("json raises a ClientException naming the address when the body is not JSON", () => {
  const response = new HttpResponse("not json", 200);

  expect(
    () => response.json(),
    throwsA(having(isA(ClientException), (raised) => raised.message, "message", contains("is not JSON"))),
  );
});

Scribe.test("body reads the charset content-type names", () => {
  const bytes = new TextEncoder().encode("hello");
  const response = new HttpResponse(bytes, 200, {
    headers: new Headers({ "content-type": "text/plain; charset=ascii" }),
  });

  expect(response.body, equals("hello"));
});

Scribe.test("body falls back to utf-8 when the content-type names no charset at all", () => {
  const response = new HttpResponse(new TextEncoder().encode("héllo"), 200);
  expect(response.body, equals("héllo"));
});

Scribe.test("body falls back to utf-8 when the content-type names a charset the platform does not know", () => {
  const bytes = new TextEncoder().encode("héllo");
  const response = new HttpResponse(bytes, 200, {
    headers: new Headers({ "content-type": "text/plain; charset=not-a-real-charset" }),
  });

  expect(response.body, equals("héllo"));
});

Scribe.test("fromStream drains a StreamedResponse whole, carrying its status and headers over", async () => {
  const streamed = new StreamedResponse(
    ByteStream.fromBytes(new TextEncoder().encode("hello")),
    201,
    { headers: new Headers({ "x-one": "1" }) },
  );

  const whole = await HttpResponse.fromStream(streamed);

  expect(whole.body, equals("hello"));
  expect(whole.statusCode, equals(201));
  expect(whole.headers.get("x-one"), equals("1"));
});

Scribe.test("fromStream refuses a body over the cap it was given", async () => {
  const streamed = new StreamedResponse(ByteStream.fromBytes(new TextEncoder().encode("hello")), 200);

  await expectLater(() => HttpResponse.fromStream(streamed, Bytes.of(2)), throwsA(isA(ClientException)));
});
