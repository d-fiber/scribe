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

export interface Contribution {
  readonly access: Caller | readonly Caller[] | null;
  readonly permissions: readonly string[];
  readonly rateLimit: RateLimiter | null;
  readonly rateLimitKey: string | null;
  readonly needs: readonly Need[];
  readonly webhookVerified: boolean | null;
  readonly wrap: ((handler: RouteHandler) => RouteHandler) | null;
}

export const NOTHING: Contribution = {
  access: null,
  permissions: [],
  rateLimit: null,
  rateLimitKey: null,
  needs: [],
  webhookVerified: null,
  wrap: null,
};

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

export function wrapAll(
  layers: readonly Contribution[],
  handler: RouteHandler,
): RouteHandler {
  return layers.reduceRight(
    (carried, layer) => (layer.wrap ? layer.wrap(carried) : carried),
    handler,
  );
}
