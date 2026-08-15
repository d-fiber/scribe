// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import {
  RequestIdentityCache,
  type RequestUser,
} from "@scribe/core/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

const FALLBACK_TTL_MS = 300_000;

export interface CapabilityGrant {
  readonly request: Request;
  readonly bodyBytes: Uint8Array;
  readonly identity: RequestUser;
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
