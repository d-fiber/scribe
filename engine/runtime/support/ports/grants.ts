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

import type { Grants, GrantSource } from "@scribe/contracts/grants.ts";
import { cache, Duration } from "@scribe/alchemy";
import type { Cache, Future } from "@scribe/alchemy";
import { TtlLru } from "@scribe/runtime/support/cache/ttl_lru.ts";

/** How long a resolved answer stays in the shared cache. */
const _CACHE_TTL: Duration = Duration.minutes(5);

/**
 * How long this process answers from its own memory before asking the shared cache again.
 *
 * Every authenticated request resolves grants, so an account calling at any rate at all is a
 * Redis round trip per request on top of the rate limiter's and the identity cache's. This
 * collapses that to one read per window per replica.
 *
 * It is short on purpose, because it is the one thing that weakens {@link GrantsResolver.invalidate}:
 * a replica holding its own copy of a role only learns of a demotion when the copy runs out. The
 * replica that was told drops its copy at once; the others wait this long, which is the same trade
 * the identity cache makes and for the same reason.
 */
const _LOCAL_TTL_MS = 5_000;

/**
 * How many accounts this process holds grants for.
 *
 * Sized on distinct accounts in flight rather than on the whole population: an account that has
 * not called in the last five seconds is worth nothing here.
 */
const _LOCAL_MAX_ENTRIES = 5_000;

/**
 * What is held for an account the deployment grants nothing.
 *
 * @remarks
 * Both tiers answer "nothing held" with a null, so an account with no row is a miss on every
 * request and a pair of calls to the source on every request, forever. A deployment where most
 * accounts carry no role pays that on its whole traffic. This sentinel is what makes "the source
 * was asked, and it granted nothing" a cacheable answer; it is read back as `null`, which is what
 * every caller already handles.
 */
const _NOTHING_GRANTED: Grants = { role: "", permissions: [] };

function _grantsNothing(grants: Grants): boolean {
  return grants.role === "" && grants.permissions.length === 0;
}

/**
 * What an account is granted, cached in three tiers on top of a pluggable {@link GrantSource}.
 *
 * @remarks
 * All state here is static: one resolver per process, since the two caching tiers below the
 * source are themselves process-wide.
 */
export class GrantsResolver {
  private static readonly _cache: Cache<Grants> = cache<Grants>({ key: "identity:grants", ttl: _CACHE_TTL });
  private static readonly _local = new TtlLru<Grants>({
    max: _LOCAL_MAX_ENTRIES,
    ttlMs: _LOCAL_TTL_MS,
  });
  private static readonly _inFlight = new Map<string, Future<Grants>>();
  private static _source: GrantSource | null = null;

  /**
   * Installs `source` as what `resolve` falls back to.
   *
   * @remarks
   * Also drops this process's local cache, since whatever it held was resolved against the
   * previous source, which a test replacing the source between cases relies on: without the drop,
   * a grant resolved under the old source would keep answering after the swap.
   */
  static use(source: GrantSource): void {
    this._source = source;
    this.forget();
  }

  /**
   * What the deployment grants `accountId`, or null when it grants nothing.
   *
   * Three tiers, each answering what the one before could not: this process, then the shared
   * cache, then the source. Concurrent callers asking for the same account share one resolution,
   * so a cold account being called by a burst costs the source one pair of queries rather than
   * one per request.
   */
  static async resolve(accountId: string): Future<Grants | null> {
    const local = this._local.get(accountId);
    if (local !== null) return _grantsNothing(local) ? null : local;

    const cached = await this._cache.get(accountId);
    if (cached !== null) {
      this._local.set(accountId, cached);
      return _grantsNothing(cached) ? null : cached;
    }

    const resolved = await this._resolveOnce(accountId);
    return _grantsNothing(resolved) ? null : resolved;
  }

  /** Forgets what a deployment grants `accountId`, or what it grants everybody when it is left out. */
  static invalidate(accountId?: string): Future<void> {
    if (accountId === undefined) {
      this.forget();
      return this._cache.clear();
    }

    this._local.delete(accountId);
    this._inFlight.delete(accountId);
    return this._cache.delete(accountId);
  }

  /**
   * Drops every set of grants this process is holding, without touching the shared cache.
   *
   * Whoever replaces what the shared cache holds has to call this, or the process keeps answering
   * from a view of the world that no longer exists. That is a test standing a fresh cache up, and
   * it is why the local tier is not something a caller can forget about.
   */
  static forget(): void {
    this._local.clear();
    this._inFlight.clear();
  }

  /**
   * Asks the source, once per account however many callers are waiting.
   *
   * @remarks
   * A cold account under a burst used to reach the source once per request: eight concurrent
   * first calls were eight role lookups and eight permission lookups. The entry is dropped as
   * soon as it settles, so a failure is retried by the next caller rather than remembered.
   */
  private static _resolveOnce(accountId: string): Future<Grants> {
    const pending = this._inFlight.get(accountId);
    if (pending !== undefined) return pending;

    const resolving = this._fromSource(accountId).finally(() => {
      this._inFlight.delete(accountId);
    });
    this._inFlight.set(accountId, resolving);
    return resolving;
  }

  private static async _fromSource(accountId: string): Future<Grants> {
    const source = this._requireSource();
    const role = await source.roleOf(accountId);
    const grants: Grants = role === null ? _NOTHING_GRANTED : {
      role,
      permissions: await source.permissionsOf(role),
    };

    this._local.set(accountId, grants);
    await this._cache.add(accountId, grants);
    return grants;
  }

  private static _requireSource(): GrantSource {
    if (this._source === null) {
      throw new Error(
        "[grants] no GrantSource registered: call GrantsResolver.use() at boot.",
      );
    }
    return this._source;
  }
}
