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
import { RequestScope } from "@scribe/runtime/scope.ts";

/** Who is calling, or null when nothing proved a call. */
export type ResolvedIdentity = RequestUser | null;

const _RESOLVED_KEY = "identity:user:resolved";
const _PENDING_KEY = "identity:user:pending";

/**
 * Who the request in scope resolved to.
 *
 * @remarks
 * Held in `RequestScope.cache` rather than resolved fresh on every read, because identity
 * resolution reaches JWKS or GoTrue, and several accessors within the same request, `currentIdentity`,
 * an access check, a route's own handler, would otherwise each pay that cost separately for the
 * one token the request actually carried.
 */
export class RequestIdentityCache {
  /** The identity already resolved for this request, or `undefined` when nothing has resolved yet. */
  static resolved(): ResolvedIdentity | undefined {
    return RequestScope.cache.get<ResolvedIdentity>(_RESOLVED_KEY);
  }

  /** Sets the resolved identity directly, bypassing `remember`, for code that already has an answer. */
  static seed(user: ResolvedIdentity): void {
    RequestScope.cache.set(_RESOLVED_KEY, user);
  }

  /**
   * Answers the resolved identity, running `resolve` only if nothing has resolved yet.
   *
   * @remarks
   * A resolution in flight is shared: a second caller that arrives while `resolve` is still
   * pending awaits the same promise instead of starting a second one, so several accessors racing
   * for the identity on one request cost a single resolution.
   */
  static async remember(
    resolve: () => Future<ResolvedIdentity>,
  ): Future<ResolvedIdentity> {
    const resolved = this.resolved();
    if (resolved !== undefined) return resolved;

    const pending = RequestScope.cache.get<Future<ResolvedIdentity>>(_PENDING_KEY);
    if (pending !== undefined) {
      const user = await pending;
      RequestScope.cache.set(_RESOLVED_KEY, user);
      return user;
    }

    const promise = resolve();
    RequestScope.cache.set(_PENDING_KEY, promise);
    const user = await promise;
    RequestScope.cache.set(_RESOLVED_KEY, user);
    return user;
  }
}

export function currentIdentity(): ResolvedIdentity {
  return RequestIdentityCache.resolved() ?? null;
}

/**
 * Who is calling, told apart from nobody having asked.
 *
 * @remarks
 * `ResolvedIdentity` folds two opposite facts into `null`: a resolution that ran and proved
 * nobody, and a path where nothing ever resolved. A reader that treats them alike either refuses
 * an anonymous caller or opens a table to a background job, and both are wrong. Everything that
 * only wants the identifier keeps using {@link currentIdentity}, which is why this sits beside it
 * rather than replacing it.
 */
export type EffectivePrincipal =
  | { readonly kind: "unproven" }
  | { readonly kind: "anonymous" }
  | { readonly kind: "identified"; readonly user: RequestUser };

const _UNPROVEN: EffectivePrincipal = { kind: "unproven" };
const _ANONYMOUS: EffectivePrincipal = { kind: "anonymous" };

/**
 * What this call proved about who is making it.
 *
 * @remarks
 * `unproven` is a path that never resolved an identity: a queue worker, a cron body, a trigger
 * handler, a webhook endpoint. It is not an anonymous caller, it is nobody having asked, and what
 * to do about it belongs to whoever is reading.
 */
export function currentPrincipal(): EffectivePrincipal {
  const resolved = RequestIdentityCache.resolved();
  if (resolved === undefined) return _UNPROVEN;
  if (resolved === null) return _ANONYMOUS;
  return { kind: "identified", user: resolved };
}
