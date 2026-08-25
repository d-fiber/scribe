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
import { Cache } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/cache_pb.ts";
import { Queue } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/queue_pb.ts";
import { Hook } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/hook_pb.ts";
import { Database } from "@scribe/sdk/gen/scribe/packages/foundation/protocol/database_pb.ts";
import { Logging } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { Auth } from "@scribe/sdk/gen/scribe/packages/auth/protocol/auth_pb.ts";
import { Realtime } from "@scribe/sdk/gen/scribe/packages/realtime/protocol/realtime_pb.ts";
import { Search } from "@scribe/sdk/gen/scribe/packages/search/protocol/search_pb.ts";
import { Storage } from "@scribe/sdk/gen/scribe/packages/storage/protocol/storage_pb.ts";
import { CapabilityTokens } from "./tokens.ts";
import { cacheDelete, cacheGet, cacheSet } from "./cache.ts";
import { hookEmit, queuePush } from "./event_driven.ts";
import { shipLogs } from "./logging.ts";
import { executeQueries, executeQuery } from "./rest.ts";
import {
  authBan,
  authDeleteAccount,
  authGetAccount,
  authKickAllDevices,
  authKickDevice,
  authListBans,
  authListDevices,
  authListRoles,
  authUnban,
} from "./auth.ts";
import { realtimeBroadcast, realtimeGrant, realtimeRevoke } from "./realtime.ts";
import { searchAdd, searchDelete, searchQuery } from "./search.ts";
import { storageDelete, storageList } from "./storage.ts";

/**
 * The host side of every procedure a worker may call.
 *
 * @remarks
 * A procedure answers only once it is named here, and the packages a handler reaches are the
 * ones `engine/embedder/deno.json` names: adding a service means both, and forgetting the second
 * is a type error rather than a silent 501.
 *
 * Anything the contract declares and this does not wire answers a named 501 rather than a 404.
 * Listing those procedures instead would mean importing the stub of every module the contract
 * knows, and that list would be wrong the day a package adds a service.
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
    .on(Logging.method.ship, (batch, call) => CapabilityTokens.run(call.capabilityToken, () => shipLogs(batch)))
    .on(
      Realtime.method.broadcast,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => realtimeBroadcast(request)),
    )
    .on(
      Realtime.method.grant,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => realtimeGrant(request)),
    )
    .on(
      Realtime.method.revoke,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => realtimeRevoke(request)),
    )
    .on(Search.method.add, (request, call) => CapabilityTokens.run(call.capabilityToken, () => searchAdd(request)))
    .on(
      Search.method.delete,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => searchDelete(request)),
    )
    .on(Search.method.search, (request, call) => CapabilityTokens.run(call.capabilityToken, () => searchQuery(request)))
    .on(
      Storage.method.delete,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => storageDelete(request)),
    )
    .on(Storage.method.list, (request, call) => CapabilityTokens.run(call.capabilityToken, () => storageList(request)))
    .on(
      Auth.method.getAccount,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => authGetAccount(request)),
    )
    .on(
      Auth.method.deleteAccount,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => authDeleteAccount(request)),
    )
    .on(Auth.method.ban, (request, call) => CapabilityTokens.run(call.capabilityToken, () => authBan(request)))
    .on(Auth.method.unban, (request, call) => CapabilityTokens.run(call.capabilityToken, () => authUnban(request)))
    .on(
      Auth.method.listBans,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => authListBans(request)),
    )
    .on(
      Auth.method.listDevices,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => authListDevices(request)),
    )
    .on(
      Auth.method.kickDevice,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => authKickDevice(request)),
    )
    .on(
      Auth.method.kickAllDevices,
      (request, call) => CapabilityTokens.run(call.capabilityToken, () => authKickAllDevices(request)),
    )
    .on(Auth.method.listRoles, (_request, call) => CapabilityTokens.run(call.capabilityToken, () => authListRoles()));

  return server.otherwise((path) => {
    throw new TransportFailure(
      "unimplemented",
      `${path} is declared by the contract but not wired on the host yet.`,
      501,
    );
  });
}
