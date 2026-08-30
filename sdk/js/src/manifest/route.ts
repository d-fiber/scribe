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

import type { Caller, Need, RouteMethod } from "../contracts/access.ts";
import type { RateLimiter } from "../contracts/rate_limit.ts";
import type { RequestContext } from "../runtime/context.ts";

export type RouteHandler = (
  ctx: RequestContext,
) => Response | Promise<Response>;

export interface WorkerRoute {
  /** The HTTP method this route answers. */
  readonly method: RouteMethod;

  /** The path this route is mounted at, colon segments naming its path parameters. */
  readonly path: string;

  /** The caller kind, or kinds, allowed to reach this route. */
  readonly access: Caller | readonly Caller[];

  /** The rate limit callers of this route are held to. */
  readonly rateLimit: RateLimiter;

  /** The key callers of this route are bucketed under for `rateLimit`. */
  readonly rateLimitKey: string;

  /** The permissions a caller must hold to reach this route. Every allowed caller passes when omitted. */
  readonly requiredPermissions?: readonly string[];

  /** Whether the host must have already verified this request as a webhook before the handler runs. */
  readonly webhookVerified?: boolean;

  /** The extra context this route's handler reads off the request, beyond what every route gets. */
  readonly needs?: readonly Need[];

  /** The function that answers a request once it clears access, permissions and the rate limit. */
  readonly handler: RouteHandler;
}

export function routeIdOf(node: string, route: WorkerRoute): string {
  return `${node}:${route.method}:${route.path}`;
}

export function routingKeyOf(node: string, route: WorkerRoute): string {
  const anonymous = route.path.replace(/:[^/]+/g, ":*");
  return `${node}:${route.method}:${anonymous}`;
}
