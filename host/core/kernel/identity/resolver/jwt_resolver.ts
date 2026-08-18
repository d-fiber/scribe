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
import type { JWTPayload } from "jose";
import { TtlLru } from "@scribe/core/runtime/support/cache/ttl_lru.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";
import {
  IDENTITY_CACHE_KEY,
  IdentityRevocation,
} from "@scribe/core/runtime/redis/identity_revocation.ts";

export interface ResolvedJwtIdentity {
  readonly id: string;
  readonly email: string | null;
  readonly isAdmin: boolean;
}

/**
 * A cached identity, carrying the expiry of the token it was resolved from.
 *
 * The cache is read before the signature is verified, so the entry has to
 * answer for the token's lifetime on its own. `exp` is `null` when the token
 * carried no such claim, which is the one case where nothing has to be
 * enforced here.
 */
interface _CachedJwtIdentity extends ResolvedJwtIdentity {
  readonly exp: number | null;
}

const _FETCH_TIMEOUT_MS = 5_000;

/**
 * How long this process answers from its own memory before asking Redis again.
 *
 * Every authenticated request reads the identity cache, so a token used at any
 * rate at all is a Redis round trip per request on top of the rate limiter's.
 * This collapses that to one read per window per replica.
 *
 * It is short on purpose, because it is the one thing that weakens revocation.
 * {@link IdentityRevocation.revoke} works by deleting the Redis entry, and a
 * process holding its own copy never learns of the deletion: for this long, a
 * revoked token and a demoted admin still hold on the replicas that were
 * already serving them. Five seconds keeps that below what an operator can
 * observe while still covering the burst a single client sends.
 */
const _LOCAL_TTL_MS = 5_000;

/**
 * How many resolved tokens this process holds.
 *
 * Sized on distinct callers in flight rather than on total users: a token that
 * has not been seen in the last five seconds is worth nothing here, and at a
 * couple of hundred bytes an entry this is under a megabyte held.
 */
const _LOCAL_MAX_ENTRIES = 5_000;

class _JwtIdentityCache extends Valkery {
  override get key(): string {
    return IDENTITY_CACHE_KEY;
  }

  override get ttl(): Time {
    return Time.minutes(5);
  }
}

function _expired(exp: number | null): boolean {
  return exp !== null && exp <= Date.now() / 1_000;
}

function _roleOf(appMetadata: unknown): unknown {
  return typeof appMetadata === "object" && appMetadata !== null
    ? (appMetadata as Record<string, unknown>).role
    : undefined;
}

function _parseGoTrueUser(
  raw: Record<string, unknown>,
): ResolvedJwtIdentity | null {
  const { id, email, app_metadata } = raw;
  if (typeof id !== "string" || !id) return null;

  return {
    id,
    email: typeof email === "string" && email ? email : null,
    isAdmin: _roleOf(app_metadata) === AccountRole.Admin,
  };
}

/**
 * The identity the token itself asserts.
 *
 * GoTrue puts the same three values in the access token that it returns from
 * `/user`, and the signature has just been checked, so the HTTP call buys
 * nothing but freshness, which {@link IdentityRevocation.recheckRequired}
 * asks for by name when it is actually needed.
 */
function _identityFromClaims(payload: JWTPayload): ResolvedJwtIdentity | null {
  const { sub, email, app_metadata } = payload as JWTPayload & {
    email?: unknown;
    app_metadata?: unknown;
  };
  if (typeof sub !== "string" || !sub) return null;

  return {
    id: sub,
    email: typeof email === "string" && email ? email : null,
    isAdmin: _roleOf(app_metadata) === AccountRole.Admin,
  };
}

export class JwtIdentityResolver {
  private static readonly _cache = new _JwtIdentityCache();

  private static readonly _local = new TtlLru<_CachedJwtIdentity>({
    max: _LOCAL_MAX_ENTRIES,
    ttlMs: _LOCAL_TTL_MS,
  });

  /**
   * The identity behind a bearer token, or `null` when the token buys nothing.
   *
   * Three tiers, each answering what the one before could not: this process,
   * then Redis, then the signature and GoTrue. The caches are consulted before
   * the signature is verified, which is what keeps the crypto off the hot path,
   * because an ES256 verification costs three quarters of everything else the
   * host does. Nothing is weakened by the order: an entry only exists because a
   * previous request verified the very token that hashes to this key, and the
   * entry carries its own expiry.
   *
   * The in-process tier costs a window of staleness that Redis alone did not.
   * See {@link _LOCAL_TTL_MS}.
   */
  static async resolveIdentity(
    jwt: string,
  ): Promise<ResolvedJwtIdentity | null> {
    const cacheKey = await sha256Hex(jwt);

    const local = this._local.get(cacheKey);
    if (local !== null && !_expired(local.exp)) return local;

    const cached = await this._cache.get<_CachedJwtIdentity>(cacheKey);
    if (cached !== null && !_expired(cached.exp)) {
      this._local.set(cacheKey, cached);
      return cached;
    }

    const payload = await JwtVerifier.verify(jwt);
    if (payload === null) return null;

    const identity = await this._identityOf(payload, jwt);
    if (identity === null) return null;

    await this._remember(identity, cacheKey, payload.exp ?? null);
    return identity;
  }

  private static async _identityOf(
    payload: JWTPayload,
    jwt: string,
  ): Promise<ResolvedJwtIdentity | null> {
    const claimed = _identityFromClaims(payload);
    if (claimed === null) return null;

    if (!(await IdentityRevocation.recheckRequired(claimed.id))) return claimed;

    const raw = await this._fetchUser(jwt);
    return raw === null ? null : _parseGoTrueUser(raw);
  }

  private static async _remember(
    identity: ResolvedJwtIdentity,
    cacheKey: string,
    exp: number | null,
  ): Promise<void> {
    const revocable = await IdentityRevocation.remember(
      identity.id,
      cacheKey,
      this._cache.ttl.value,
    );
    if (!revocable) {
      console.error(
        "[jwt-resolver] identity left uncached: revocation index unavailable",
      );
      return;
    }

    this._local.set(cacheKey, { ...identity, exp });
    await this._cache.add<_CachedJwtIdentity>(cacheKey, { ...identity, exp });
  }

  /**
   * Revokes a user, and drops what this process was holding for anybody.
   *
   * The local cache is keyed by token, so there is no way to pick out the
   * entries belonging to one user. Everything goes: a revocation is rare, and
   * the alternative is serving this user from memory for the whole window on
   * the very replica that was told to stop. The other replicas still wait it
   * out, which is what the window means.
   */
  static invalidate(userId: string): Promise<void> {
    this.forget();
    return IdentityRevocation.revoke(userId);
  }

  /**
   * Drops every identity this process is holding, without touching Redis.
   *
   * Whoever replaces what the shared cache holds has to call this, or the
   * process keeps answering from a view of the world that no longer exists.
   * That is a test standing a fresh cache up, and it is why the local tier is
   * not something a caller can forget about.
   */
  static forget(): void {
    this._local.clear();
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
