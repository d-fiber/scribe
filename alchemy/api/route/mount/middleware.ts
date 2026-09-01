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

import type { UnmodifiableList } from "../../../value/list.ts";
import type { Caller, Need } from "../access.ts";
import type { RateLimit } from "../rate_limit.ts";
import type { RouteHandler } from "./route.ts";
import type { Contribution } from "./contribution.ts";
import { BASE } from "./instances.ts";

/**
 * What a `_middleware.ts` declares for everything under it.
 *
 * @remarks
 * It says the same things an {@link Endpoint} says, minus what only a route can answer, plus one a
 * route cannot: {@link wrap} puts code around the call itself.
 *
 * A middleware is written once per folder and every route beneath it takes what it declared, so it
 * is where a rule that holds for a whole area of the tree belongs. What a route says overrides it,
 * except the permissions and the needs, which gather.
 *
 * @example
 * ```ts ignore
 * export default class extends Middleware {
 *   protected override access() {
 *     return "authenticated";
 *   }
 * }
 * ```
 */
export abstract class Middleware {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static readonly [BASE] = true;

  /** Who this middleware says may call anything beneath it, or null to say nothing. */
  protected access(): Caller | UnmodifiableList<Caller> | null {
    return null;
  }

  /** What it says the caller has to have been granted, added to what the routes beneath ask. */
  protected permissions(): UnmodifiableList<string> {
    return [];
  }

  /** How often it says a route beneath may be called, or null to leave it to each of them. */
  protected rateLimit(): RateLimit | null {
    return null;
  }

  /** What it says a call has to carry, added to what the routes beneath ask. */
  protected needs(): UnmodifiableList<Need> {
    return [];
  }

  /** Whether it says an incoming hook must already be checked, or null to say nothing. */
  protected webhookVerified(): boolean | null {
    return null;
  }

  /**
   * What this middleware puts around the call, given the handler beneath it.
   *
   * @remarks
   * It is the one thing a route cannot declare for itself, and what a middleware exists for: the
   * handler it is given is everything under it, so what is written before the call runs on the way
   * in and what is written after runs on the way out.
   *
   * @returns The handler to hang in place of the one given, or that one to add nothing.
   */
  protected wrap(handler: RouteHandler): RouteHandler {
    return handler;
  }

  /**
   * Everything this middleware declares, gathered into one layer.
   *
   * A middleware has no reason to override it: what it wants to change is one of the declarations
   * it gathers. The key a rate limit counts against is left to the route, since a middleware
   * covering several of them has no one key to name.
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

/**
 * The middleware at the top of a node, which every route of that node passes through.
 *
 * @remarks
 * It declares nothing a {@link Middleware} does not. What it changes is where it may sit: a node
 * has exactly one, written at its root, so the rules that hold for the whole node are read in one
 * file rather than gathered from several.
 */
export abstract class NodeRoot extends Middleware {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static override readonly [BASE] = true;
}
