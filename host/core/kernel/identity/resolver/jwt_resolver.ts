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

import { Duration } from "@scribe/alchemy";
import { JwtVerifier } from "@scribe/core/kernel/identity/resolver/jwt_verifier.ts";
import { IDENTITY_CACHE_KEY, IdentityRevocation } from "@scribe/core/runtime/redis/identity_revocation.ts";
import { TtlLru } from "@scribe/core/runtime/support/cache/ttl_lru.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { identitySettings } from "@scribe/core/runtime/support/settings/identity.ts";
import { get } from "@scribe/foundation/lib/src/http/mod.ts";
import { Valkery } from "@scribe/foundation/lib/src/valkery/valkery.ts";
import type { JWTPayload } from "jose";

/** Who a bearer token names, and everything it asserts about them. */
export interface ResolvedJwtIdentity {
  /** What the token names as the subject, which is what an owned row is keyed on. */
  readonly id: string;

  /**
   * Everything else the token asserted, as it arrived.
   *
   * @remarks
   * The framework reads none of it. An address, a telephone number, a tenant, whatever the
   * identity provider was told to put in `app_metadata`: which of those exist and what any of
   * them means is a fact about a deployment, and reading one here would make this framework
   * decide it for all of them.
   */
  readonly claims: Readonly<Record<string, unknown>>;
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

const _FETCH_TIMEOUT: Duration = Duration.seconds(5);

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

function _expired(exp: number | null): boolean {
  return exp !== null && exp <= Date.now() / 1_000;
}

/** Who the identity service says the token names, when it was asked directly. */
function _parseGoTrueUser(
  raw: Record<string, unknown>,
): ResolvedJwtIdentity | null {
  const { id, ...claims } = raw;
  if (typeof id !== "string" || !id) return null;

  return { id, claims };
}

/**
 * The identity the token itself asserts.
 *
 * GoTrue puts the same three values in the access token that it returns from
 * `/user`, and the signature has just been checked, so the HTTP call buys
 * nothing but freshness, which {@link IdentityRevocation.recheckRequired}
 * asks for by name when it is actually needed.
 */
/** Who the token says it names, read from the token alone, without asking anybody. */
function _identityFromClaims(payload: JWTPayload): ResolvedJwtIdentity | null {
  const { sub, ...claims } = payload;
  if (typeof sub !== "string" || !sub) return null;

  return { id: sub, claims };
}

export class JwtIdentityResolver {
  private static readonly _cache = new Valkery<_CachedJwtIdentity>({
    key: IDENTITY_CACHE_KEY,
    ttl: Duration.minutes(5),
  });

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

    const cached = await this._cache.get(cacheKey);
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
      this._cache.ttl.inSeconds,
    );
    if (!revocable) {
      console.error(
        "[jwt-resolver] identity left uncached: revocation index unavailable",
      );
      return;
    }

    this._local.set(cacheKey, { ...identity, exp });
    await this._cache.add(cacheKey, { ...identity, exp });
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
      const res = await get(`${identitySettings.get().authUrl}/user`, {
        headers: {
          "Content-Type": "application/json",
          apikey: identitySettings.get().anonKey,
          Authorization: `Bearer ${jwt}`,
        },
        timeout: _FETCH_TIMEOUT,
      });
      return res.ok ? res.json<Record<string, unknown>>() : null;
    } catch {
      return null;
    }
  }
}
