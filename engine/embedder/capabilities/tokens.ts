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

import type { Future } from "@scribe/alchemy";
import type { RequestUser } from "@scribe/alchemy/route";
import { RequestIdentityCache } from "@scribe/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";

const FALLBACK_TTL_MS = 300_000;

export interface CapabilityGrant {
  /** The request the invocation carried, replayed through `RequestScope.run` when this grant is redeemed. */
  readonly request: Request;

  /** The request body bytes the invocation carried, replayed alongside `request` when this grant is redeemed. */
  readonly bodyBytes: Uint8Array;

  /**
   * Who the invocation this grant came from proved, or `null` when it proved nobody.
   *
   * @remarks
   * Left out entirely when no invocation came in at all, which is the worker's standing
   * credential and nothing else. The three cases are not two: `null` is an anonymous caller and
   * reads no row of an owned table, while absent is nobody having asked, which `ownerScope`
   * refuses outright rather than narrowing. Seeding `null` for both made a credential that
   * answered no request pass for a request that proved nobody.
   */
  readonly identity?: RequestUser | null;

  /** The trace identifier the invocation carried, threaded through so a redeemed call ties back to it. */
  readonly traceId: string;

  /** The invocation identifier the invocation carried, threaded through so a redeemed call ties back to it. */
  readonly invocationId: string;
}

interface StoredGrant extends CapabilityGrant {
  /**
   * When this grant stops being redeemable, or `null` when it stands as long as the host holds it.
   *
   * A standing grant is not a longer-lived one: it is a grant whose life is an attachment rather
   * than a stretch of time. The worker's bootstrap credential is the only one, and putting a
   * figure on it made a host that runs longer than the figure lose the worker's ambient
   * capabilities on a path nobody watches.
   */
  readonly expiresAt: number | null;
}

export class UnknownCapabilityToken extends Error {
  constructor() {
    super("The capability token is unknown, expired or already revoked.");
    this.name = "UnknownCapabilityToken";
  }
}

const grants = new Map<string, StoredGrant>();

/**
 * The token of the standing grant, when one stands.
 *
 * There is at most one, because there is one attached worker and this is the credential it calls
 * back with outside any dispatch. Holding it is what lets a second attachment revoke the first
 * one's: without that, every attachment left a live credential behind for the life of the process.
 */
let standingToken: string | null = null;

/**
 * How long the store goes between two sweeps.
 *
 * A sweep walks every grant, so running one on each issue makes issuing cost the
 * size of the store: at ten thousand grants in flight a host answers about twelve
 * thousand tokens a second whatever the rest of the request costs, and the curve
 * is quadratic in how many are alive at once.
 *
 * The gate is safe because the sweep was never what makes an expired grant
 * unusable. `redeem` checks `expiresAt` itself and deletes on the way out, so a
 * grant that has run out is refused the moment somebody presents it, whichever
 * side of a sweep that happens on. What the gate delays is only when the memory
 * comes back, by at most this long.
 */
const SWEEP_EVERY_MS = 1_000;

let sweptAt = 0;

/**
 * Drops every grant that has run out, but not more than once per [SWEEP_EVERY_MS].
 *
 * @param now - The moment the caller is working against.
 */
function expired(grant: StoredGrant, now: number): boolean {
  return grant.expiresAt !== null && grant.expiresAt <= now;
}

function sweep(now: number): void {
  if (now - sweptAt < SWEEP_EVERY_MS) return;
  sweptAt = now;

  for (const [token, grant] of grants) {
    if (expired(grant, now)) grants.delete(token);
  }
}

export const CapabilityTokens = {
  /**
   * Hands out a token for `grant`, good for `ttlMs`.
   *
   * @param ttlMs - How long the grant may be redeemed for, or `null` for one that stands until it
   * is revoked. Only the worker's bootstrap credential is issued standing, because its life is the
   * attachment and not a stretch of time.
   */
  issue(grant: CapabilityGrant, ttlMs: number | null = FALLBACK_TTL_MS): string {
    const now = Date.now();
    sweep(now);

    const token = crypto.randomUUID();
    grants.set(token, { ...grant, expiresAt: ttlMs === null ? null : now + ttlMs });
    return token;
  },

  /**
   * Hands out the one standing token of this host, revoking whatever stood before it.
   *
   * @remarks
   * A standing grant is not a longer-lived one: it is a grant whose life is an attachment rather
   * than a stretch of time. Only the worker's bootstrap credential is issued this way, and nothing
   * ever hands it back, so replacing it is the only moment the previous one can be dropped.
   */
  standing(grant: Omit<CapabilityGrant, "identity">): string {
    if (standingToken !== null) CapabilityTokens.revoke(standingToken);

    standingToken = CapabilityTokens.issue(grant, null);
    return standingToken;
  },

  revoke(token: string): void {
    grants.delete(token);
    if (token === standingToken) standingToken = null;
  },

  redeem(token: string): CapabilityGrant | null {
    const grant = grants.get(token);
    if (!grant) return null;
    if (expired(grant, Date.now())) {
      grants.delete(token);
      return null;
    }
    return grant;
  },

  /**
   * Whether `token` names a grant that may still be redeemed.
   *
   * It is what the capability port asks before it reads a body or names a procedure, so that a
   * caller holding nothing learns nothing: without it, the port answers a wired procedure and an
   * unwired one differently, which is the host's own surface read off by anybody who can reach
   * the socket.
   */
  holds(token: string): boolean {
    return CapabilityTokens.redeem(token) !== null;
  },

  run<T>(token: string, handler: () => Future<T>): Future<T> {
    const grant = CapabilityTokens.redeem(token);
    if (!grant) return Promise.reject(new UnknownCapabilityToken());

    return RequestScope.run(grant.request, grant.bodyBytes, () => {
      // Seeded only when an invocation came in. Seeding `null` for a grant that answered no
      // request tells the rest of the process that somebody called and proved nobody, which is
      // the one thing `currentPrincipal` exists to tell apart.
      if (grant.identity !== undefined) RequestIdentityCache.seed(grant.identity);
      return handler();
    });
  },

  get size(): number {
    return grants.size;
  },
};
