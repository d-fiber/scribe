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
import { contains, equals, expect, having, isA, MemoryClient, Scribe, throwsA } from "@scribe/alchemy/test";

Scribe.test('the default answer is a 200 with the body "ok"', async () => {
  const client = new MemoryClient();

  const response = await client.get("https://example.test/health");

  expect(response.statusCode, equals(200));
  expect(response.body, equals("ok"));
});

Scribe.test("every request handed to the client is kept, in order", async () => {
  const client = new MemoryClient();

  await client.get("https://example.test/one");
  await client.get("https://example.test/two");

  expect(client.seen.length, equals(2));
  expect(client.seen[0].url.pathname, equals("/one"));
  expect(client.seen[1].url.pathname, equals("/two"));
});

Scribe.test("a configured answer is what every request receives", async () => {
  const client = new MemoryClient({ status: 404, body: "not found", headers: { "x-reason": "missing" } });

  const response = await client.get("https://example.test/missing");

  expect(response.statusCode, equals(404));
  expect(response.body, equals("not found"));
  expect(response.headers.get("x-reason"), equals("missing"));
});

Scribe.test("only answers the one request seen, and refuses when that is not true", async () => {
  const client = new MemoryClient();

  expect(
    () => client.only,
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("Expected one request, got 0"))),
  );

  await client.get("https://example.test/one");
  expect(client.only.url.pathname, equals("/one"));

  await client.get("https://example.test/two");
  expect(
    () => client.only,
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("Expected one request, got 2"))),
  );
});

Scribe.test("close counts every call it receives", () => {
  const client = new MemoryClient();

  client.close();
  client.close();
  client.close();

  expect(client.closed, equals(3));
});
