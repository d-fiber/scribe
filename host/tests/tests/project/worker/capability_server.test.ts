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

import { assertEquals, assertStringIncludes } from "@std/assert";
import { fromBinary } from "@bufbuild/protobuf";
import { FailureSchema } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import { Storage } from "@scribe/sdk/gen/scribe/host/packages/storage/protocol/storage_pb.ts";
import { procedurePath } from "@scribe/sdk/src/transport/wire.ts";
import { capabilityServer } from "@scribe/host/project/worker/capability_server.ts";

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
