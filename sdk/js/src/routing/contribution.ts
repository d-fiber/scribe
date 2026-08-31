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

/** One layer's contribution to a route's rules, merged with every other layer that applies to it. */
export interface Contribution {
  /** The caller kind this layer restricts a route to, or `null` when it leaves access to another layer. */
  readonly access: Caller | readonly Caller[] | null;

  /** The permissions this layer adds. `merge` concatenates every layer's list rather than replacing it. */
  readonly permissions: readonly string[];

  /** The rate limit this layer sets, or `null` when it leaves the limit to another layer. */
  readonly rateLimit: RateLimiter | null;

  /** The rate limit key this layer sets, or `null` when it leaves the key to another layer. */
  readonly rateLimitKey: string | null;

  /** The extra context this layer adds. `merge` concatenates every layer's list rather than replacing it. */
  readonly needs: readonly Need[];

  /** Whether this layer marks the route as requiring a verified webhook, or `null` to leave that to another layer. */
  readonly webhookVerified: boolean | null;

  /** How this layer wraps a handler, or `null` when it contributes nothing to `wrapAll`. */
  readonly wrap: ((handler: RouteHandler) => RouteHandler) | null;
}

/** The identity element `merge` starts folding from: a layer that leaves every rule to the others. */
export const NOTHING: Contribution = {
  access: null,
  permissions: [],
  rateLimit: null,
  rateLimitKey: null,
  needs: [],
  webhookVerified: null,
  wrap: null,
};

/**
 * Folds `layers` into the one set of rules a route runs under.
 *
 * @remarks
 * `layers` is expected outermost first: the node's own contribution, then each `_middleware.ts`
 * from the root down to the route's folder, then the endpoint's own. A scalar field, `access`,
 * `rateLimit`, `rateLimitKey`, `webhookVerified`, takes whichever layer set it last, so the layer
 * closest to the route always wins over one further out. `permissions` and `needs` instead
 * concatenate every layer that contributed one, since those are additive rather than a single
 * choice one layer makes for the whole route.
 */
export function merge(layers: readonly Contribution[]): Contribution {
  return layers.reduce<Contribution>((carried, layer) => ({
    access: layer.access ?? carried.access,
    permissions: [...carried.permissions, ...layer.permissions],
    rateLimit: layer.rateLimit ?? carried.rateLimit,
    rateLimitKey: layer.rateLimitKey ?? carried.rateLimitKey,
    needs: [...carried.needs, ...layer.needs],
    webhookVerified: layer.webhookVerified ?? carried.webhookVerified,
    wrap: null,
  }), NOTHING);
}

/**
 * Wraps `handler` in every layer's {@link Contribution.wrap}, outermost layer running first.
 *
 * @remarks
 * `layers` arrives outermost first, the same order {@link merge} takes, so building from the right
 * end is what makes the outermost middleware the one that actually runs first: each layer wraps
 * what the layers after it in the array already produced, ending with the node's own contribution
 * as the outside of the whole chain.
 */
export function wrapAll(
  layers: readonly Contribution[],
  handler: RouteHandler,
): RouteHandler {
  return layers.reduceRight(
    (carried, layer) => (layer.wrap ? layer.wrap(carried) : carried),
    handler,
  );
}
