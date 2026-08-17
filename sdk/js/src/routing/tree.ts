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

import type { RouteMethod } from "../contracts/access.ts";
import { type MountedRoute, mountedRoute } from "../manifest/worker.ts";
import type { RouteHandler, WorkerRoute } from "../manifest/route.ts";
import { type Contribution, merge, wrapAll } from "./contribution.ts";
import type { DiscoveredRoute } from "./discovery.ts";
import { Endpoint } from "./endpoint.ts";
import { instances } from "./instances.ts";
import { Middleware } from "./middleware.ts";

export class RoutingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoutingError";
  }
}

function endpointsOf(discovered: DiscoveredRoute): Endpoint[] {
  const found = instances<Endpoint>(discovered.module, Endpoint);

  const byMethod = new Map<RouteMethod, Endpoint>();
  for (const endpoint of found) {
    if (byMethod.has(endpoint.method)) {
      throw new RoutingError(
        `${discovered.file} declares ${endpoint.method.toUpperCase()} twice: ` +
          `one file answers one method once.`,
      );
    }
    byMethod.set(endpoint.method, endpoint);
  }

  return [...byMethod.values()];
}

function branchLayers(discovered: DiscoveredRoute): Contribution[] {
  return discovered.branches.flatMap((branch) =>
    instances<Middleware>(branch, Middleware).map((middleware) => middleware.contribution())
  );
}

function routeOf(
  discovered: DiscoveredRoute,
  endpoint: Endpoint,
  inherited: readonly Contribution[],
): WorkerRoute {
  const layers = [...inherited, ...branchLayers(discovered), endpoint.contribution()];
  const merged = merge(layers);

  if (merged.access === null) {
    throw new RoutingError(
      `${discovered.file} answers ${endpoint.method.toUpperCase()} without any access: ` +
        `declare it on the endpoint, on a _middleware.ts, or on the node.`,
    );
  }

  if (merged.rateLimit === null) {
    throw new RoutingError(
      `${discovered.file} answers ${endpoint.method.toUpperCase()} without any rate limit: ` +
        `declare it on the endpoint, on a _middleware.ts, or on the node.`,
    );
  }

  const handler: RouteHandler = (ctx) => endpoint.handle(ctx);

  return {
    method: endpoint.method,
    path: discovered.path,
    access: merged.access,
    rateLimit: merged.rateLimit,
    rateLimitKey: merged.rateLimitKey ??
      `${discovered.node}:${endpoint.method}:${discovered.path}`,
    requiredPermissions: [...new Set(merged.permissions)],
    webhookVerified: merged.webhookVerified ?? false,
    needs: [...new Set(merged.needs)],
    handler: wrapAll(layers, handler),
  };
}

export function compileNode(
  node: string,
  inherited: readonly Contribution[],
  discovered: readonly DiscoveredRoute[],
): readonly MountedRoute[] {
  return discovered
    .filter((route) => route.node === node)
    .flatMap((route) =>
      endpointsOf(route).map((endpoint) =>
        mountedRoute(node, routeOf(route, endpoint, inherited))
      )
    );
}
