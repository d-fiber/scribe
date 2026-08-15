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

import { AccountRole } from "@scribe/core/contracts/account.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { identitySettings } from "@scribe/core/runtime/support/settings/identity.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { JwtVerifier } from "@scribe/core/kernel/identity/resolver/jwt_verifier.ts";
import { Valkery } from "@scribe/core/runtime/redis/cache/valkery.ts";
import {
  IDENTITY_CACHE_KEY,
  IdentityRevocation,
} from "@scribe/core/runtime/redis/identity_revocation.ts";

export interface ResolvedJwtIdentity {
  readonly id: string;
  readonly email: string | null;
  readonly isAdmin: boolean;
}

const _FETCH_TIMEOUT_MS = 5_000;

class _JwtIdentityCache extends Valkery {
  override get key(): string {
    return IDENTITY_CACHE_KEY;
  }

  override get ttl(): Time {
    return Time.minutes(5);
  }
}

function _parseGoTrueUser(
  raw: Record<string, unknown>,
): ResolvedJwtIdentity | null {
  const { id, email, app_metadata } = raw;
  if (typeof id !== "string" || !id) return null;

  const role =
    typeof app_metadata === "object" && app_metadata !== null
      ? (app_metadata as Record<string, unknown>).role
      : undefined;

  return {
    id,
    email: typeof email === "string" && email ? email : null,
    isAdmin: role === AccountRole.Admin,
  };
}

export class JwtIdentityResolver {
  private static readonly _cache = new _JwtIdentityCache();

  static async resolveIdentity(
    jwt: string,
  ): Promise<ResolvedJwtIdentity | null> {
    if ((await JwtVerifier.verify(jwt)) === null) return null;

    const cacheKey = await sha256Hex(jwt);
    const cached = await this._cache.get<ResolvedJwtIdentity>(cacheKey);
    if (cached !== null) return cached;

    const raw = await this._fetchUser(jwt);
    if (raw === null) return null;

    const identity = _parseGoTrueUser(raw);
    if (identity === null) return null;

    const revocable = await IdentityRevocation.remember(
      identity.id,
      cacheKey,
      this._cache.ttl.value,
    );
    if (!revocable) {
      console.error(
        "[jwt-resolver] identity left uncached: revocation index unavailable",
      );
      return identity;
    }

    await this._cache.add(cacheKey, identity);
    return identity;
  }

  static invalidate(userId: string): Promise<void> {
    return IdentityRevocation.revoke(userId);
  }

  private static async _fetchUser(
    jwt: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${identitySettings.get().authUrl}/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: identitySettings.get().anonKey,
          Authorization: `Bearer ${jwt}`,
        },
        signal: AbortSignal.timeout(_FETCH_TIMEOUT_MS),
      });
      return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}
