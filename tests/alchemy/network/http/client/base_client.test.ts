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
import { equals, expect, expectLater, isA, Scribe, throwsA } from "@scribe/alchemy/test";
import { Bytes } from "@scribe/alchemy";
import type { BaseRequest } from "@scribe/alchemy/http";
import { BaseClient, ByteStream, ClientException, StreamedResponse } from "@scribe/alchemy/http";

class Recording extends BaseClient {
  readonly seen: BaseRequest[] = [];

  constructor(private readonly body = "ok", private readonly status = 200) {
    super();
  }

  override send(request: BaseRequest): Promise<StreamedResponse> {
    this.seen.push(request);
    return Promise.resolve(
      new StreamedResponse(ByteStream.fromBytes(new TextEncoder().encode(this.body)), this.status, { request }),
    );
  }
}

Scribe.test("a string body is sent as text, and sets a text content-type", async () => {
  const client = new Recording();
  await client.post("https://example.test/one", { body: "hello" });

  expect(client.seen[0].headers.get("content-type"), equals("text/plain; charset=utf-8"));
});

Scribe.test("a Uint8Array body is sent as-is, announcing no content-type", async () => {
  const client = new Recording();
  await client.post("https://example.test/one", { body: new Uint8Array([1, 2, 3]) });

  expect(
    client.seen[0].headers.has("content-type"),
    equals(false),
    "raw bytes were given a content-type nobody asked for",
  );
});

Scribe.test("a record body is sent as a url-encoded form", async () => {
  const client = new Recording();
  await client.post("https://example.test/one", { body: { name: "ada" } });

  expect(client.seen[0].headers.get("content-type"), equals("application/x-www-form-urlencoded; charset=utf-8"));
});

Scribe.test("no body at all leaves the request exactly as built, no content-type set", async () => {
  const client = new Recording();
  await client.get("https://example.test/one");

  expect(client.seen[0].headers.has("content-type"), equals(false));
});

Scribe.test("headers given in options are carried onto the request", async () => {
  const client = new Recording();
  await client.get("https://example.test/one", { headers: { "x-request-id": "abc" } });

  expect(client.seen[0].headers.get("x-request-id"), equals("abc"));
});

Scribe.test("readBytes reads the body of a successful call", async () => {
  const client = new Recording("hello", 200);
  expect(await client.readBytes("https://example.test/one"), equals(new TextEncoder().encode("hello")));
});

Scribe.test("readBytes refuses a status outside the two hundreds, the same as read", async () => {
  const client = new Recording("not found", 404);

  await expectLater(() => client.readBytes("https://example.test/one"), throwsA(isA(ClientException)));
});

Scribe.test("close does nothing by default, and is safe to call", () => {
  const client = new Recording();
  client.close();
});

Scribe.test("maxResponseBytes given in options caps how much of the body is read", async () => {
  const client = new Recording("a very long body that goes past the cap", 200);

  await expectLater(
    () => client.get("https://example.test/one", { maxResponseBytes: Bytes.of(4) }),
    throwsA(isA(ClientException)),
  );
});
