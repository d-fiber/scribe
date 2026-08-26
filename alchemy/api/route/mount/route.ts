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

import type { Future } from "../../../async/future.ts";
import type { UnmodifiableList } from "../../../value/list.ts";
import type { Caller, Need, RouteMethod } from "../access.ts";
import type { RateLimit } from "../rate_limit.ts";
import type { RequestContext } from "../context.ts";

/**
 * What answers one call.
 *
 * It is what an endpoint becomes once it is compiled, and what a middleware wraps: a plain
 * function, so a wrapper needs to know nothing about the class it came from.
 */
export type RouteHandler = (
  ctx: RequestContext,
) => Response | Future<Response>;

/**
 * A route once every layer above it has been read, ready to be hung on a node.
 *
 * @remarks
 * It is the other side of {@link Contribution}: there, each layer says what it wants and may say
 * nothing; here, the question is settled. What no layer answered has a default by the time a route
 * reaches this shape, which is why {@link access}, {@link rateLimit} and {@link rateLimitKey} are
 * no longer allowed to be null.
 *
 * The three optional fields are the ones that mean nothing when nobody asked for them: an empty
 * list of permissions and a route that does not care about hooks are the same as their absence.
 */
export interface WorkerRoute {
  /** The verb this route answers. */
  readonly method: RouteMethod;

  /** The path it answers, parameters written as `:name`. */
  readonly path: string;

  /** Who may call it, settled from every layer above. */
  readonly access: Caller | UnmodifiableList<Caller>;

  /** How often it may be called, settled from every layer above. */
  readonly rateLimit: RateLimit;

  /** What the count is kept against, settled from every layer above. */
  readonly rateLimitKey: string;

  /** What the caller has to have been granted, gathered from every layer above. */
  readonly requiredPermissions?: UnmodifiableList<string>;

  /** Whether an incoming hook must already have been checked before this route answers. */
  readonly webhookVerified?: boolean;

  /** What a call has to carry beyond who is making it, gathered from every layer above. */
  readonly needs?: UnmodifiableList<Need>;

  /** What answers the call, every middleware of the node already wrapped around it. */
  readonly handler: RouteHandler;
}

/** What names `route` on `node` across the whole worker. */
export function routeIdOf(node: string, route: WorkerRoute): string {
  return `${node}:${route.method}:${route.path}`;
}

/**
 * What names the shape of `route` on `node`, every parameter written as a star.
 *
 * @remarks
 * It is what a count or a measurement is kept against, where {@link routeIdOf} would open one per
 * value a parameter ever took. Two calls on the same route differing only by an identifier belong
 * to the same key.
 */
export function routingKeyOf(node: string, route: WorkerRoute): string {
  const anonymous = route.path.replace(/:[^/]+/g, ":*");
  return `${node}:${route.method}:${anonymous}`;
}

/**
 * A route once it is mounted on a node, which is where it gets an identity.
 *
 * @remarks
 * A route on its own says a verb and a path. Which node answers it is decided at the mount, and it
 * is the pair that is addressable: two nodes may hold the same path and mean two different things.
 */
export interface MountedRoute {
  /** The node that answers this route. */
  readonly node: string;

  /** What names this route across the whole worker, worked out from the node and the route. */
  readonly routeId: string;

  /** The route itself, as it was declared. */
  readonly route: WorkerRoute;
}

/** Mounts `route` on `node`, working out the identity the pair carries. */
export function mountedRoute(node: string, route: WorkerRoute): MountedRoute {
  return { node, routeId: routeIdOf(node, route), route };
}
