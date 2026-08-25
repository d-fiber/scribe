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
import { request } from "@scribe/runtime/http/request.ts";
import { GrantsResolver } from "@scribe/runtime/support/ports/grants.ts";
import { JwtIdentityResolver } from "./resolver/jwt_resolver.ts";
import { RequestIdentityCache, type ResolvedIdentity } from "@scribe/runtime/http/accessors/identity.ts";

/** How many dot-separated parts a JSON web token is made of. */
const JWT_SEGMENTS = 3;

/** The bearer token of the request, when it is shaped like a token at all. */
function _bearerJwt(): string | null {
  const jwt = request.token();
  if (jwt === null) return null;

  const segments = jwt.split(".");
  const wellFormed = segments.length === JWT_SEGMENTS &&
    segments.every((segment) => segment.length > 0);

  return wellFormed ? jwt : null;
}

/** Who the bearer token names, with what the deployment grants them, or null when it names nobody. */
async function _resolveFromJwt(): Future<ResolvedIdentity> {
  const jwt = _bearerJwt();
  if (!jwt) return null;

  const identity = await JwtIdentityResolver.resolveIdentity(jwt);
  if (identity === null) return null;

  const granted = await GrantsResolver.resolve(identity.id);

  const user: RequestUser = {
    id: identity.id,
    caller: "authenticated",
    role: granted?.role ?? "",
    permissions: granted?.permissions ?? [],
    claims: identity.claims,
  };
  return user;
}

/** Who is calling, resolved once per request and remembered for the rest of it. */
function _currentUser(): Future<ResolvedIdentity> {
  return RequestIdentityCache.remember(_resolveFromJwt);
}

/** Forgets what a deployment grants `id`, or what it grants everybody when `id` is left out. */
export function invalidateGrants(id?: string): Future<void> {
  return GrantsResolver.invalidate(id);
}

/**
 * Who is calling, as far as anything can be told about them.
 *
 * @remarks
 * There is one kind of caller here and not two. Whether somebody is an administrator, an author
 * or a tenant owner is a word a deployment chose, and it travels as {@link role}. A framework
 * that told them apart would be deciding, for every deployment at once, which words exist.
 */
export class RequestIdentity {
  /** Whether anything proved this call at all. */
  static async isConnected(): Future<boolean> {
    return (await _currentUser()) !== null;
  }

  /** What identifies the caller, or null when nothing proved the call. */
  static async userId(): Future<string | null> {
    return (await _currentUser())?.id ?? null;
  }

  /** What the deployment calls the caller, or null when it calls them nothing. */
  static async role(): Future<string | null> {
    const role = (await _currentUser())?.role ?? "";
    return role === "" ? null : role;
  }

  /** Who was already resolved on this request, without resolving anybody. */
  static get current(): ResolvedIdentity {
    return RequestIdentityCache.resolved() ?? null;
  }
}

/** What the caller is allowed to do, read the same way whoever is calling. */
export class RbacIdentity extends RequestIdentity {
  /** Every permission the caller holds. Empty when nothing proved the call. */
  static async permissions(): Future<string[]> {
    return (await _currentUser())?.permissions.slice() ?? [];
  }

  /** Whether the caller holds every one of `required`. */
  static async grants(required: readonly string[]): Future<boolean> {
    const held = await this.permissions();
    return required.every((permission) => held.includes(permission));
  }
}
