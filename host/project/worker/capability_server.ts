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

import { TransportFailure, UnaryServer } from "@scribe/sdk";
import { Cache } from "@scribe/sdk/gen/scribe/host/core/runtime/redis/cache/protocol/cache_pb.ts";
import { Queue } from "@scribe/sdk/gen/scribe/host/core/runtime/event_driven/queue/protocol/queue_pb.ts";
import { Hook } from "@scribe/sdk/gen/scribe/host/core/runtime/event_driven/hook/protocol/hook_pb.ts";
import { Rest } from "@scribe/sdk/gen/scribe/host/dependencies/database/rest/protocol/rest_pb.ts";
import { Logging } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { CapabilityTokens } from "./capability_tokens.ts";
import { cacheDelete, cacheGet, cacheSet } from "./capabilities/cache.ts";
import { hookEmit, queuePush } from "./capabilities/event_driven.ts";
import { shipLogs } from "./capabilities/logging.ts";
import { executeQuery } from "./capabilities/rest.ts";

export function capabilityServer(): UnaryServer {
  const server = new UnaryServer()
    .on(Rest.method.execute, (query, call) =>
      CapabilityTokens.run(call.capabilityToken, () => executeQuery(query)))
    .on(Cache.method.get, (request, call) =>
      CapabilityTokens.run(call.capabilityToken, () => cacheGet(request)))
    .on(Cache.method.set, (request, call) =>
      CapabilityTokens.run(call.capabilityToken, () => cacheSet(request)))
    .on(Cache.method.delete, (request, call) =>
      CapabilityTokens.run(call.capabilityToken, () => cacheDelete(request)))
    .on(Queue.method.push, (request, call) =>
      CapabilityTokens.run(call.capabilityToken, () => queuePush(request)))
    .on(Hook.method.emit, (event, call) =>
      CapabilityTokens.run(call.capabilityToken, () => hookEmit(event)))
    .on(Logging.method.ship, (batch, call) =>
      CapabilityTokens.run(call.capabilityToken, () => shipLogs(batch)));

  // Anything the contract declares and the loop above did not wire answers a
  // named 501 rather than a 404. Listing those procedures would mean importing
  // the stub of every module the contract knows, and that list would be wrong
  // the day a package adds a service.
  return server.otherwise((path) => {
    throw new TransportFailure(
      "unimplemented",
      `${path} is declared by the contract but not wired on the host yet.`,
      501,
    );
  });
}
