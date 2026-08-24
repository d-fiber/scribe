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

import { assertEquals, assertStringIncludes } from "@std/assert";
import { fromBinary } from "@bufbuild/protobuf";
import { FailureSchema } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import { Storage } from "@scribe/sdk/gen/scribe/engine/packages/storage/protocol/storage_pb.ts";
import { procedurePath } from "@scribe/sdk/src/transport/wire.ts";
import { capabilityServer } from "@scribe/engine/embedder/capabilities/server.ts";

/** Calls `path` on the host's capability server, the way a worker would. */
async function call(path: string): Promise<{ status: number; code: string; message: string }> {
  const response = await capabilityServer().handle(
    new Request(new URL(path, "http://host.test"), { method: "POST", body: new Uint8Array() }),
  );
  const failure = fromBinary(FailureSchema, new Uint8Array(await response.arrayBuffer()));

  return { status: response.status, code: failure.code, message: failure.message };
}

Deno.test("a procedure the contract declares and the host does not wire answers a named 501", async () => {
  // Storage stands for every module the host mounts without serving its
  // capability. The point is not this service in particular: nothing lists
  // them any more, so any unwired path takes the same road.
  const path = procedurePath(Storage.method.upload);
  const answer = await call(path);

  assertEquals(answer.status, 501);
  assertEquals(answer.code, "unimplemented");
  assertStringIncludes(answer.message, path);
});

Deno.test("a path the contract does not declare takes the same road", async () => {
  const answer = await call("/scribe.v1.Nope/Call");

  assertEquals(answer.status, 501);
  assertStringIncludes(answer.message, "/scribe.v1.Nope/Call");
});
