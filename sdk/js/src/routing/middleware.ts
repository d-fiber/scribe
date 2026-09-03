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

import type { Caller, Need } from "../contracts/access.ts";
import type { RateLimiter } from "../contracts/rate_limit.ts";
import type { RouteHandler } from "../manifest/route.ts";
import type { Contribution } from "./contribution.ts";

/**
 * The base every route-level middleware extends, contributing checks without terminating the
 * request.
 *
 * @remarks
 * `access`, `permissions`, `rateLimit`, `needs` and `webhookVerified` are read once per route,
 * when `tree.ts` discovers it, and merged with whatever the endpoint and the node contribute; a
 * request never re-runs them. `wrap` is different: `tree.ts` calls it once too, at the same
 * build-time step, but the function it returns is folded into the route's actual handler chain by
 * `wrapAll`, so unlike the other five, what `wrap` produces does run on every request.
 */
export abstract class Middleware {
  /** The caller kind this middleware restricts access to, or `null` to leave that to another layer. */
  protected access(): Caller | readonly Caller[] | null {
    return null;
  }

  /** The permissions this middleware requires, on top of whatever another layer already requires. */
  protected permissions(): readonly string[] {
    return [];
  }

  /** The rate limiter this middleware sets, or `null` to leave the limit to another layer. */
  protected rateLimit(): RateLimiter | null {
    return null;
  }

  /** The extra context this middleware requires, on top of whatever another layer already requires. */
  protected needs(): readonly Need[] {
    return [];
  }

  /** Whether this middleware requires a verified webhook, or `null` to leave that to another layer. */
  protected webhookVerified(): boolean | null {
    return null;
  }

  /**
   * Wraps `handler`, or answers it unchanged when this middleware has nothing to add around it.
   *
   * @remarks
   * Called once, while the route is being built, but the closure it returns becomes part of the
   * handler chain the host invokes on every request to the route. This class's other check
   * methods only ever produce metadata read once.
   */
  protected wrap(handler: RouteHandler): RouteHandler {
    return handler;
  }

  /**
   * Collects this middleware's access, rate limit and webhook requirements into one `Contribution`.
   *
   * @remarks
   * Called once, when `tree.ts` discovers the route this middleware applies to, and merged there
   * with whatever the endpoint and the node itself contribute.
   */
  contribution(): Contribution {
    return {
      access: this.access(),
      permissions: this.permissions(),
      rateLimit: this.rateLimit(),
      rateLimitKey: null,
      needs: this.needs(),
      webhookVerified: this.webhookVerified(),
      wrap: (handler) => this.wrap(handler),
    };
  }
}

/** A middleware that wraps every route a node declares, rather than one route in particular. */
export abstract class NodeRoot extends Middleware {}
