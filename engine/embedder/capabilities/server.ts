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

import type { Future } from "@scribe/alchemy";
import { type CallMetadata, failureResponse, metadataOf, TransportFailure, UnaryServer } from "@scribe/sdk";
import { Logging } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import { capabilities } from "@scribe/contracts/capability.ts";
import { CapabilityTokens } from "./tokens.ts";
import { shipLogs } from "./logging.ts";

/**
 * Wraps `handler` so it only runs once the call's capability token has been replayed.
 *
 * @remarks
 * Every procedure the host answers itself needs this same wrapping, and `capabilities.wire()`
 * needs it for every procedure a package registers too: what each one would otherwise have to
 * remember, one of them will forget. See {@link capabilityServer}.
 */
function guarded<I, O>(handler: (request: I) => Future<O>): (request: I, call: CallMetadata) => Future<O> {
  return (request, call) => CapabilityTokens.run(call.capabilityToken, () => handler(request));
}

/**
 * The host side of every procedure a worker may call.
 *
 * @remarks
 * A procedure answers only once it is named here, and the packages a handler reaches are the
 * ones `engine/embedder/_collection.json` names: adding a service means both, and forgetting the
 * second is a type error rather than a silent 501.
 *
 * What the host answers itself is `Logging.Ship` alone, because it is the one procedure with no
 * package behind it to own: a project without a `_logs.ts` still has a worker that calls it, and
 * `shipLogs` is the acknowledgment that call gets. Every other procedure, `foundation`'s own
 * database, cache, queue and hook included, is registered by the package that owns it through
 * `capabilities.wire()`, so mounting a package is what makes a worker able to call it, and the host
 * names none of them itself. Replaying the capability token is done here rather than by each
 * package, because a package that had to do it would be one that could forget to.
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
    .on(Logging.method.ship, guarded(shipLogs));

  capabilities.wire({
    on: (method, handler) => server.on(method, guarded(handler)),
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
