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

import type { List, UnmodifiableList } from "../../../value/list.ts";
import { callersOf, type RouteMethod } from "../access.ts";
import { type MountedRoute, mountedRoute, type RouteHandler, type WorkerRoute } from "./route.ts";
import { type Contribution, merge, wrapAll } from "./contribution.ts";
import type { DiscoveredRoute } from "./discovery.ts";
import { Endpoint } from "../endpoint.ts";
import { instances } from "./instances.ts";
import { Middleware } from "./middleware.ts";
import { ScribeError } from "../../../error/scribe_error.ts";

/**
 * A node that cannot be compiled, because of what somebody wrote in it.
 *
 * @remarks
 * It descends from {@link ScribeError} because it is a fault in what somebody wrote, and the
 * message is the whole of what helps: it already names the file, the verb and where to write the
 * declaration that is missing. The stack it used to keep pointed at this file, which is not the one
 * that is wrong.
 */
export class RoutingError extends ScribeError {
  /** Builds a refusal saying, in `message`, which file is wrong and what to write instead. */
  constructor(message: string) {
    super(message);
    this.name = "RoutingError";
  }
}

/**
 * Every endpoint `discovered` exported, at most one per verb.
 *
 * @remarks
 * A file answering the same verb twice is refused rather than one of them silently winning. Which
 * of the two would have answered depends on the order the exports were read, which is not something
 * anybody should have to know.
 */
function endpointsOf(discovered: DiscoveredRoute): List<Endpoint> {
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

/** What every middleware between the root of the node and `discovered` declares, root first. */
function branchLayers(discovered: DiscoveredRoute): List<Contribution> {
  return discovered.branches.flatMap((branch) =>
    instances<Middleware>(branch, Middleware).map((middleware) => middleware.contribution())
  );
}

/**
 * Settles what `endpoint` requires, reading every layer above it, and hands back the route.
 *
 * @remarks
 * Three things have no default and are refused rather than guessed: who may call, how often, and
 * whether an incoming signature has already been checked. Falling back to something open would
 * make a file somebody forgot to write look exactly like a file that meant to be open, and the two
 * must not be told apart by reading the framework. That reasoning covers the signature as much as
 * the other two, which is why a route under no hook root says `false` out loud.
 *
 * A route naming callers its node does not allow is refused for the same reason, rather than
 * answering nobody: a route that can never be reached is a file somebody wrote by mistake.
 *
 * @throws {RoutingError} When no layer said who may call, how often, or whether a signature is
 * checked, or when the route names only callers nothing above it allows.
 */
function routeOf(
  discovered: DiscoveredRoute,
  endpoint: Endpoint,
  inherited: UnmodifiableList<Contribution>,
): WorkerRoute {
  const layers = [...inherited, ...branchLayers(discovered), endpoint.contribution()];
  const merged = merge(layers);

  if (merged.access === null) {
    throw new RoutingError(
      `${discovered.file} answers ${endpoint.method.toUpperCase()} without any access: ` +
        `declare it on the endpoint, on a _middleware.ts, or on the node.`,
    );
  }

  if (callersOf(merged.access).length === 0) {
    throw new RoutingError(
      `${discovered.file} answers ${endpoint.method.toUpperCase()} to callers nothing above it ` +
        `allows: a route narrows the access of its node and never widens it.`,
    );
  }

  if (merged.rateLimit === null) {
    throw new RoutingError(
      `${discovered.file} answers ${endpoint.method.toUpperCase()} without any rate limit: ` +
        `declare it on the endpoint, on a _middleware.ts, or on the node.`,
    );
  }

  if (merged.webhookVerified === null) {
    throw new RoutingError(
      `${discovered.file} answers ${endpoint.method.toUpperCase()} without saying whether an ` +
        `incoming signature is checked: declare webhookVerified() on the endpoint, on a ` +
        `_middleware.ts, or on the node.`,
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
    webhookVerified: merged.webhookVerified,
    needs: [...new Set(merged.needs)],
    handler: wrapAll(layers, handler),
  };
}

/**
 * Turns what the generator found into the routes `node` answers.
 *
 * @remarks
 * It is what the host calls once per node at boot, and the whole of what this folder exists for.
 * Everything it can refuse, it refuses here rather than at the first call: a node that compiles is
 * a node whose routes all know who may call them.
 *
 * @param node - The node being built, which is what decides which of `discovered` belongs to it.
 * @param inherited - What the node itself declares, sitting above every middleware of the tree.
 * @param discovered - Every route file the generator found, for every node.
 *
 * @throws {RoutingError} When a file answers one verb twice, or when a route ends up without an
 * access or a rate limit.
 */
export function compileNode(
  node: string,
  inherited: UnmodifiableList<Contribution>,
  discovered: UnmodifiableList<DiscoveredRoute>,
): UnmodifiableList<MountedRoute> {
  return discovered
    .filter((route) => route.node === node)
    .flatMap((route) => endpointsOf(route).map((endpoint) => mountedRoute(node, routeOf(route, endpoint, inherited))));
}
