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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import { assertEquals, assertStringIncludes } from "@std/assert";
import { fromBinary } from "@bufbuild/protobuf";
import { FailureSchema } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import { Storage } from "@scribe/sdk/gen/scribe/packages/storage/protocol/storage_pb.ts";
import { procedurePath } from "@scribe/sdk/src/transport/wire.ts";
import { capabilityHandler, capabilityServer } from "@scribe/embedder/capabilities/server.ts";
import { CapabilityTokens } from "@scribe/embedder/capabilities/tokens.ts";
import { Database } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/database_pb.ts";
import { assert } from "@std/assert";

/** Calls `path` on the host's capability server, the way a worker would. */
async function call(path: string): Promise<{ status: number; code: string; message: string }> {
  const response = await capabilityServer().handle(
    new Request(new URL(path, "http://host.test"), { method: "POST", body: new Uint8Array() }),
  );
  const failure = fromBinary(FailureSchema, new Uint8Array(await response.arrayBuffer()));

  return { status: response.status, code: failure.code, message: failure.message };
}

Scribe.test("a procedure nothing behind it can answer honestly is left to the named 501", async () => {
  const path = procedurePath(Storage.method.upload);
  const answer = await call(path);

  assertEquals(answer.status, 501);
  assertEquals(answer.code, "unimplemented");
  assertStringIncludes(answer.message, path);
});

Scribe.test("a path the contract does not declare takes the same road", async () => {
  const answer = await call("/scribe.v1.Nope/Call");

  assertEquals(answer.status, 501);
  assertStringIncludes(answer.message, "/scribe.v1.Nope/Call");
});

/** Calls the port the way anything on the network would, with `token` or with nothing. */
function reach(path: string, token: string | null, body = new Uint8Array()): Request {
  const headers = new Headers({ "content-type": "application/proto" });
  if (token !== null) headers.set("scribe-capability", token);

  return new Request(new URL(path, "http://host.test"), { method: "POST", headers, body: body as BodyInit });
}

Scribe.test("the capability port answers a caller holding nothing the same way whatever it asks for", async () => {
  const port = capabilityHandler();

  const answers = await Promise.all(
    [procedurePath(Database.method.execute), procedurePath(Storage.method.upload), "/scribe.v1.Nope/Call"]
      .map((path) => port(reach(path, null))),
  );

  assertEquals(
    answers.map((answer) => answer.status),
    [401, 401, 401],
    "a wired procedure answering differently from an unwired one is the host's surface read off by anybody",
  );
});

Scribe.test("the capability port refuses before it reads the body", async () => {
  const port = capabilityHandler();
  const request = reach(procedurePath(Database.method.execute), null, new Uint8Array(1024 * 1024));

  const answer = await port(request);

  assertEquals(answer.status, 401);
  assertEquals(
    request.bodyUsed,
    false,
    "a caller holding nothing must not be able to make the host hold a megabyte for it",
  );
});

Scribe.test("the capability port lets a token holder through to the named 501", async () => {
  const port = capabilityHandler();
  const token = CapabilityTokens.issue({
    request: new Request("http://worker.bootstrap/"),
    bodyBytes: new Uint8Array(),
    identity: null,
    traceId: "",
    invocationId: "",
  });

  try {
    const path = procedurePath(Storage.method.upload);
    const answer = await port(reach(path, token));

    assertEquals(answer.status, 501, "a worker that holds a token is owed the name of what it asked for");
    const failure = fromBinary(FailureSchema, new Uint8Array(await answer.arrayBuffer()));
    assertStringIncludes(failure.message, path);
  } finally {
    CapabilityTokens.revoke(token);
  }
});

Scribe.test("a token that has run out reaches no procedure at all", async () => {
  const port = capabilityHandler();
  const token = CapabilityTokens.issue({
    request: new Request("http://worker.bootstrap/"),
    bodyBytes: new Uint8Array(),
    identity: null,
    traceId: "",
    invocationId: "",
  }, -1);

  const answer = await port(reach(procedurePath(Database.method.execute), token));

  assertEquals(answer.status, 401);
  assert(!CapabilityTokens.holds(token));
});
