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

import type { RequestUser } from "@scribe/alchemy/route";
import { RequestIdentityCache } from "@scribe/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";

const FALLBACK_TTL_MS = 300_000;

export interface CapabilityGrant {
  readonly request: Request;
  readonly bodyBytes: Uint8Array;
  readonly identity: RequestUser | null;
  readonly traceId: string;
  readonly invocationId: string;
}

interface StoredGrant extends CapabilityGrant {
  readonly expiresAt: number;
}

export class UnknownCapabilityToken extends Error {
  constructor() {
    super("The capability token is unknown, expired or already revoked.");
    this.name = "UnknownCapabilityToken";
  }
}

const grants = new Map<string, StoredGrant>();

function sweep(now: number): void {
  for (const [token, grant] of grants) {
    if (grant.expiresAt <= now) grants.delete(token);
  }
}

export const CapabilityTokens = {
  issue(grant: CapabilityGrant, ttlMs: number = FALLBACK_TTL_MS): string {
    const now = Date.now();
    sweep(now);

    const token = crypto.randomUUID();
    grants.set(token, { ...grant, expiresAt: now + ttlMs });
    return token;
  },

  revoke(token: string): void {
    grants.delete(token);
  },

  redeem(token: string): CapabilityGrant | null {
    const grant = grants.get(token);
    if (!grant) return null;
    if (grant.expiresAt <= Date.now()) {
      grants.delete(token);
      return null;
    }
    return grant;
  },

  run<T>(token: string, handler: () => Promise<T>): Promise<T> {
    const grant = CapabilityTokens.redeem(token);
    if (!grant) return Promise.reject(new UnknownCapabilityToken());

    return RequestScope.run(grant.request, grant.bodyBytes, () => {
      RequestIdentityCache.seed(grant.identity);
      return handler();
    });
  },

  get size(): number {
    return grants.size;
  },
};
