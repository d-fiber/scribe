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

import {
  contains,
  equals,
  expect,
  expectLater,
  fail,
  having,
  isA,
  isFalse,
  isTrue,
  mock,
  throwsA,
  verify,
  when,
} from "../../src/test/mod.ts";
import type { BaseRequest, Client } from "../../src/http/mod.ts";
import { BaseClient, ByteStream, DEFAULT_REQUEST_TIMEOUT, StreamedResponse } from "../../src/http/mod.ts";
import type { HttpResponse } from "../../src/http/mod.ts";
import { Clients, http } from "../../src/http/mod.ts";

class Recording extends BaseClient {
  constructor(private readonly seen: BaseRequest[], private readonly status = 200) {
    super();
  }

  override send(request: BaseRequest): Promise<StreamedResponse> {
    this.seen.push(request);
    return Promise.resolve(
      new StreamedResponse(new ByteStream(ReadableStream.from([new Uint8Array()])), this.status, { request }),
    );
  }
}

function standing(): { client: Client; opened: number } {
  const client = mock<Client>({ named: "client" });
  when(() => client.close()).thenReturn(undefined);

  const counted = { client, opened: 0 };
  Clients.use({
    open: () => {
      counted.opened += 1;
      return client;
    },
  });
  return counted;
}

Deno.test("a one-off verb opens a client, runs one exchange and closes it", async () => {
  const standingBy = standing();
  when(() => standingBy.client.get("https://example.test/health", undefined))
    .thenResolve(mock<HttpResponse>());

  await http.get("https://example.test/health");

  expect(standingBy.opened, equals(1));
  verify(() => standingBy.client.close()).once();
});

Deno.test("the client is closed even when the exchange fails", async () => {
  const standingBy = standing();
  when(() => standingBy.client.post("https://example.test/orders", undefined))
    .thenReject(new Error("refused the connection"));

  await expectLater(
    () => http.post("https://example.test/orders"),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("refused"))),
  );

  verify(() => standingBy.client.close()).once();
});

Deno.test("delete is spelled in full, which a free function could not be", async () => {
  const standingBy = standing();
  when(() => standingBy.client.delete("https://example.test/orders/7", undefined))
    .thenResolve(mock<HttpResponse>());

  await http.delete("https://example.test/orders/7");

  verify(() => standingBy.client.delete("https://example.test/orders/7", undefined)).once();
});

Deno.test("read hands back the body the client read", async () => {
  const standingBy = standing();
  when(() => standingBy.client.read("https://example.test/version", undefined))
    .thenResolve("1.2.0");

  expect(await http.read("https://example.test/version"), equals("1.2.0"));
});

Deno.test("a client taken by hand is not closed by anybody else", () => {
  const standingBy = standing();

  const taken = http.open();

  expect(taken, equals(standingBy.client));
  expect(standingBy.opened, equals(1));
});

Deno.test("nothing opens a client until a call is made", () => {
  const standingBy = standing();

  expect(standingBy.opened, equals(0));
});

Deno.test("an outbound call has a finite deadline and refuses a redirect unless it was asked to follow", async () => {
  const seen: BaseRequest[] = [];
  const client = new Recording(seen);

  await client.get("https://example.test/one");

  expect(seen[0].timeoutMs, equals(DEFAULT_REQUEST_TIMEOUT.inMilliseconds), "an outbound call had no deadline");
  expect(seen[0].followRedirects, isFalse, "an outbound call followed a redirect nobody asked it to follow");
});

Deno.test("a caller that means to follow a redirect says so, and how far", async () => {
  const seen: BaseRequest[] = [];
  const client = new Recording(seen);

  await client.get("https://example.test/one", { redirect: "follow", maxRedirects: 2 });

  expect(seen[0].followRedirects, isTrue);
  expect(seen[0].maxRedirects, equals(2));
});

Deno.test("what a refusal names of an address is the host and the path, and nothing of the query", async () => {
  const client = new Recording([], 403);

  try {
    await client.read("https://user:hunter2@example.test/v1?access_token=SECRET-42");
    fail("a 403 was read as if it carried an answer");
  } catch (raised) {
    const said = (raised as Error).message;
    expect(said.includes("SECRET-42"), isFalse, "the refusal carried the token out of the process");
    expect(said.includes("hunter2"), isFalse, "the refusal carried the password out of the process");
    expect(said.includes("https://example.test/v1"), isTrue, "the refusal did not say what was called");
  }
});
