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

import type { Hono } from "hono";
import { Caller as ProtoCaller } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import type {
  Manifest,
  NodeDeclaration,
  RateLimiter as ProtoRateLimiter,
  Route,
} from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { Duration } from "@scribe/alchemy";
import type { Caller, RateLimit } from "@scribe/alchemy/route";
import { honoMethodOf } from "./methods.ts";
import { serve } from "./dispatch.ts";
import type { WorkerClient } from "./client.ts";

export type NodeResolver = (node: NodeDeclaration) => Hono;

/** Raised when the manifest cannot be mounted: an unnamed node, a route naming an undeclared node, or a route with no rate limit. */
export class NodeMountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NodeMountError";
  }
}

/**
 * What each caller of the protocol is, in the vocabulary the host reasons with.
 *
 * @remarks
 * `USER` and `ADMIN` are the same answer, because both name somebody holding a session and the
 * difference between them is a word a deployment chose. A route that wants more than a session
 * says so in its required permissions, which is the only thing this layer can check without
 * deciding for every deployment which populations exist.
 */
const callers: Record<ProtoCaller, Caller> = {
  [ProtoCaller.UNSPECIFIED]: "anonymous",
  [ProtoCaller.ANONYMOUS]: "anonymous",
  [ProtoCaller.USER]: "authenticated",
  [ProtoCaller.ADMIN]: "authenticated",
  [ProtoCaller.SERVICE]: "service",
  [ProtoCaller.WEBHOOK]: "webhook",
};

/**
 * The limit `route` declares, refusing a route that declares none.
 *
 * @remarks
 * A missing limiter used to become a limit of zero, and a limit of zero measures nothing: the
 * driver says so on a line and lets the caller through, so the route was **unlimited** and wrote a
 * log entry per request saying it. The two ways to read the manifest disagreed, since the JS SDK
 * already refuses to compile such a route, and the host is the side that has to hold for a worker
 * written in another language.
 *
 * Refusing here means the whole attachment stops, once, naming the route. That is the failure a
 * deployment can act on; the other one is a rate limit nobody has that nobody sees.
 */
function limitOf(route: Route): RateLimit {
  const limiter: ProtoRateLimiter | undefined = route.rateLimit;
  if (limiter === undefined) {
    throw new NodeMountError(
      `${route.routeId} declares no rate limit. A route without one is a route nothing counts: ` +
        `declare it on the endpoint, on a middleware, or on the node.`,
    );
  }

  return {
    limit: limiter.limit,
    window: Duration.milliseconds(Number(limiter.window?.millis ?? 0n)),
    penalty: Duration.milliseconds(Number(limiter.penalty?.millis ?? 0n)),
    maxPenalty: limiter.maxPenalty ? Duration.milliseconds(Number(limiter.maxPenalty.millis)) : undefined,
  };
}

/**
 * A route as the host answers it, with everything the manifest only spells once already read.
 *
 * @remarks
 * The callers and the limit were derived from the protobuf on every request, which is a handful of
 * allocations per call for a value that cannot change while the worker stays attached.
 */
export interface MountedRoute {
  /** The route the manifest declared, as the invocation still needs it. */
  readonly route: Route;

  /** The ways of proving a call this route accepts, in the vocabulary the host reasons with. */
  readonly access: readonly Caller[];

  /** The quota this route holds a caller to. */
  readonly limit: RateLimit;
}

function mountedRoute(route: Route): MountedRoute {
  return {
    route,
    access: route.access.map((caller) => callers[caller]),
    limit: limitOf(route),
  };
}

export function mountManifest(
  resolve: NodeResolver,
  manifest: Manifest,
  client: WorkerClient,
): number {
  const apps = new Map<string, Hono>();

  for (const node of manifest.nodes) {
    if (node.name.trim() === "") {
      throw new NodeMountError("A node without a name reached the manifest.");
    }
    apps.set(node.name, resolve(node));
  }

  let mounted = 0;
  for (const route of manifest.routes) {
    const app = apps.get(route.node);
    if (!app) {
      throw new NodeMountError(
        `${route.routeId} belongs to the node "${route.node}", which the manifest never declares.`,
      );
    }

    const prepared = mountedRoute(route);
    app[honoMethodOf(route.method)](route.path, (c) => serve(prepared, client, c));
    mounted += 1;
  }

  return mounted;
}
