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
    .flatMap((route) => endpointsOf(route).map((endpoint) => mountedRoute(node, routeOf(route, endpoint, inherited))));
}
