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

import { TransportFailure, UnaryServer } from "@scribe/sdk";
import { Valkery } from "@scribe/sdk/gen/scribe/engine/packages/foundation/protocol/valkery/valkery_pb.ts";
import { Queue } from "@scribe/sdk/gen/scribe/engine/packages/foundation/protocol/queue/queue_pb.ts";
import { Hook } from "@scribe/sdk/gen/scribe/engine/packages/foundation/protocol/hook/hook_pb.ts";
import { Database } from "@scribe/sdk/gen/scribe/engine/packages/foundation/protocol/database/database_pb.ts";
import { Logging } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { CapabilityTokens } from "./capability_tokens.ts";
import { cacheDelete, cacheGet, cacheSet } from "./capabilities/cache.ts";
import { hookEmit, queuePush } from "./capabilities/event_driven.ts";
import { shipLogs } from "./capabilities/logging.ts";
import { executeQueries, executeQuery } from "./capabilities/rest.ts";

export function capabilityServer(): UnaryServer {
  const server = new UnaryServer()
    .on(Database.method.execute, (query, call) => CapabilityTokens.run(call.capabilityToken, () => executeQuery(query)))
    .on(
      Database.method.executeBatch,
      (batch, call) => CapabilityTokens.run(call.capabilityToken, () => executeQueries(batch)),
    )
    .on(Valkery.method.get, (request, call) => CapabilityTokens.run(call.capabilityToken, () => cacheGet(request)))
    .on(Valkery.method.set, (request, call) => CapabilityTokens.run(call.capabilityToken, () => cacheSet(request)))
    .on(
      Valkery.method.delete,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => cacheDelete(request)),
    )
    .on(Queue.method.push, (request, call) => CapabilityTokens.run(call.capabilityToken, () => queuePush(request)))
    .on(Hook.method.emit, (event, call) => CapabilityTokens.run(call.capabilityToken, () => hookEmit(event)))
    .on(Logging.method.ship, (batch, call) => CapabilityTokens.run(call.capabilityToken, () => shipLogs(batch)));

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
