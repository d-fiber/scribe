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

import { failureResponse, metadataOf, TransportFailure, UnaryServer } from "@scribe/sdk";
import { Cache } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/cache_pb.ts";
import { Queue } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/queue_pb.ts";
import { Hook } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/hook_pb.ts";
import { Database } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/database_pb.ts";
import { Logging } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { capabilities } from "@scribe/contracts/capability.ts";
import { CapabilityTokens } from "./tokens.ts";
import { cacheDelete, cacheGet, cacheSet } from "./cache.ts";
import { hookEmit } from "./hook.ts";
import { queuePush } from "./queue.ts";
import { shipLogs } from "./logging.ts";
import { executeQueries, executeQuery } from "./database.ts";

/**
 * The host side of every procedure a worker may call.
 *
 * @remarks
 * A procedure answers only once it is named here, and the packages a handler reaches are the
 * ones `engine/embedder/deno.json` names: adding a service means both, and forgetting the second
 * is a type error rather than a silent 501.
 *
 * What the host answers itself is what `foundation` needs to exist at all: the database, the
 * cache, the queue, the hook and the logs. Everything else is registered by the package that owns
 * it, so mounting a package is what makes a worker able to call it, and the host names none of
 * them. Replaying the capability token is done here rather than by each package, because a package
 * that had to do it would be one that could forget to.
 *
 * Anything the contract declares and nobody wires answers a named 501 rather than a 404. Listing
 * those procedures instead would mean importing the stub of every module the contract knows, and
 * that list would be wrong the day a package adds a service.
 *
 * Three declared procedures are deliberately left to that 501, because nothing behind them can
 * answer honestly rather than because nobody got to them. They are named in
 * `.claude/scribe/engine/embedder.md`.
 */
export function capabilityServer(): UnaryServer {
  const server = new UnaryServer()
    .on(Database.method.execute, (query, call) => CapabilityTokens.run(call.capabilityToken, () => executeQuery(query)))
    .on(
      Database.method.executeBatch,
      (batch, call) => CapabilityTokens.run(call.capabilityToken, () => executeQueries(batch)),
    )
    .on(Cache.method.get, (request, call) => CapabilityTokens.run(call.capabilityToken, () => cacheGet(request)))
    .on(Cache.method.set, (request, call) => CapabilityTokens.run(call.capabilityToken, () => cacheSet(request)))
    .on(
      Cache.method.delete,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => cacheDelete(request)),
    )
    .on(Queue.method.push, (request, call) => CapabilityTokens.run(call.capabilityToken, () => queuePush(request)))
    .on(Hook.method.emit, (event, call) => CapabilityTokens.run(call.capabilityToken, () => hookEmit(event)))
    .on(Logging.method.ship, (batch, call) => CapabilityTokens.run(call.capabilityToken, () => shipLogs(batch)));

  capabilities.wire({
    on: (method, handler) =>
      server.on(method, (request, call) => CapabilityTokens.run(call.capabilityToken, () => handler(request))),
  });

  return server.otherwise((path) => {
    throw new TransportFailure(
      "unimplemented",
      `${path} is declared by the contract but not wired on the host yet.`,
      501,
    );
  });
}

/**
 * The handler the capability port answers with, gate included.
 *
 * @remarks
 * The gate is here and not in each procedure, for the reason {@link capabilityServer} gives about
 * replaying the token: what every handler has to remember, one of them will forget. It also runs
 * *before* the protocol server, which is what the per-handler wrapper could never do. Without it a
 * caller holding nothing still had the whole body read into memory before anything looked at its
 * token, and still learned which procedures the host wires from the difference between the answer
 * to a wired one and the named 501 of an unwired one.
 *
 * {@link capabilityServer} keeps answering that 501, because a worker that holds a token and asks
 * for a procedure nobody wired is owed the name of what it asked for.
 */
export function capabilityHandler(): (request: Request) => Promise<Response> {
  const server = capabilityServer();

  return (request) => {
    if (!CapabilityTokens.holds(metadataOf(request).capabilityToken)) {
      return Promise.resolve(failureResponse(
        new TransportFailure("unauthorized", "This port answers a capability token and nothing else.", 401),
      ));
    }

    return server.handle(request);
  };
}
