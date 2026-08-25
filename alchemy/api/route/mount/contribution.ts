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
import { type Caller, callersOf, type Need } from "../access.ts";
import type { RateLimit } from "../rate_limit.ts";
import type { RouteHandler } from "./route.ts";

/**
 * What one layer of a node declares about the routes underneath it.
 *
 * @remarks
 * An endpoint gives one, and so does every middleware between it and the root of the node. What
 * a route ends up requiring is what {@link merge} makes of them all, so nothing here is what a
 * route is: it is one voice among several.
 *
 * A field that answers null is a layer that has nothing to say, which is what lets the layer
 * beneath decide. The two lists are the exception, and they gather instead of overriding: a
 * permission required higher up cannot be dropped further down.
 */
export interface Contribution {
  /** Who this layer says may call, or null to leave the question to another layer. */
  readonly access: Caller | UnmodifiableList<Caller> | null;

  /** What this layer says the caller has to have been granted, added to what the others ask. */
  readonly permissions: UnmodifiableList<string>;

  /** How often this layer says a route may be called, or null to leave it to another layer. */
  readonly rateLimit: RateLimit | null;

  /** What this layer says the count is kept against, or null to count against the caller. */
  readonly rateLimitKey: string | null;

  /** What this layer says a call has to carry, added to what the others ask. */
  readonly needs: UnmodifiableList<Need>;

  /** Whether this layer says an incoming hook must already be checked, or null to say nothing. */
  readonly webhookVerified: boolean | null;

  /**
   * What this layer puts around the handler, or null when it puts nothing.
   *
   * It is the one field {@link merge} drops rather than merging, because wrapping is an order and
   * not a value: {@link wrapAll} is what applies them, outermost layer first.
   */
  readonly wrap: ((handler: RouteHandler) => RouteHandler) | null;
}

/** A layer that says nothing at all, and what {@link merge} starts from. */
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
 * What the layers of `layers` say once taken together, from the root of a node down to the route.
 *
 * @remarks
 * It is a ratchet: a layer closer to the route may narrow what the layers above it allowed, and
 * may never widen it. A root that closed a node to administrators stays closed however the files
 * beneath it are written, which is what lets somebody read a `_middleware.ts` and know what it
 * governs without opening every route under it.
 *
 * Each field ratchets in the way that field is tightened. {@link Contribution.access} intersects,
 * and a route naming a caller no layer above allowed settles on nobody rather than on itself.
 * {@link Contribution.rateLimit} keeps whichever of the two admits fewer calls over time.
 * {@link Contribution.webhookVerified} only ever turns on: a layer may require a checked
 * signature, and none beneath it may lift the requirement. The two lists gather, because a
 * permission or a need asked higher up is a requirement and not a preference.
 *
 * A route that means to answer a wider audience than its node says so by moving, or by the node
 * saying it: there is deliberately no way to write it in the route itself, because that is the
 * line that used to be crossed by accident.
 *
 * {@link Contribution.wrap} comes back null: {@link wrapAll} is what handles it.
 */
export function merge(layers: UnmodifiableList<Contribution>): Contribution {
  return layers.reduce<Contribution>((carried, layer) => ({
    access: narrowedAccess(carried.access, layer.access),
    permissions: [...carried.permissions, ...layer.permissions],
    rateLimit: stricterLimit(carried.rateLimit, layer.rateLimit),
    rateLimitKey: layer.rateLimitKey ?? carried.rateLimitKey,
    needs: [...carried.needs, ...layer.needs],
    webhookVerified: eitherRequires(carried.webhookVerified, layer.webhookVerified),
    wrap: null,
  }), NOTHING);
}

/**
 * The callers `said` leaves once what `carried` allowed is taken into account.
 *
 * @remarks
 * It always answers a list, so what {@link merge} settles on is one shape whatever the layers
 * wrote. An empty answer is a route that named only callers nothing above it allowed; it is kept
 * rather than refused here, because the layer that can name the file is the one that compiles the
 * node, not this one.
 */
function narrowedAccess(
  carried: Caller | UnmodifiableList<Caller> | null,
  said: Caller | UnmodifiableList<Caller> | null,
): UnmodifiableList<Caller> | null {
  if (said === null) return carried === null ? null : callersOf(carried);
  if (carried === null) return callersOf(said);

  const allowed = new Set(callersOf(carried));
  return callersOf(said).filter((caller) => allowed.has(caller));
}

/** Whichever of the two admits fewer calls over the same span, or the only one that was given. */
function stricterLimit(carried: RateLimit | null, said: RateLimit | null): RateLimit | null {
  if (said === null) return carried;
  if (carried === null) return said;

  return ratePerMillisecond(said) < ratePerMillisecond(carried) ? said : carried;
}

/** How many calls `limit` admits per millisecond, which is what makes two windows comparable. */
function ratePerMillisecond(limit: RateLimit): number {
  return limit.limit / limit.window.inMilliseconds;
}

/**
 * Whether either layer requires the signature to have been checked already.
 *
 * @remarks
 * It answers null only while no layer has said anything, so a node that never decided is told
 * apart from one that decided against, and {@link compileNode} can refuse the first.
 */
function eitherRequires(carried: boolean | null, said: boolean | null): boolean | null {
  if (carried === null) return said;
  if (said === null) return carried;

  return carried || said;
}

/**
 * Puts every wrapper of `layers` around `handler`, the outermost layer ending up outermost.
 *
 * @remarks
 * It runs from the end of the list backwards, so a layer written closer to the root sees the call
 * before the ones below it and answers after them.
 */
export function wrapAll(
  layers: UnmodifiableList<Contribution>,
  handler: RouteHandler,
): RouteHandler {
  return layers.reduceRight(
    (carried, layer) => (layer.wrap ? layer.wrap(carried) : carried),
    handler,
  );
}
