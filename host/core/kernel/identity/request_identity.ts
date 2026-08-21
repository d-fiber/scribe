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

import type { SessionAdmin, SessionUser } from "@scribe/core/contracts/account.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { AdminRbacResolver } from "@scribe/core/runtime/support/ports/rbac_resolver.ts";
import { JwtIdentityResolver } from "./resolver/jwt_resolver.ts";
import { RequestIdentityCache, type RequestUser } from "@scribe/core/runtime/http/accessors/identity.ts";

const JWT_SEGMENTS = 3;

function _bearerJwt(): string | null {
  const jwt = request.token();
  if (jwt === null) return null;

  const segments = jwt.split(".");
  const wellFormed = segments.length === JWT_SEGMENTS &&
    segments.every((segment) => segment.length > 0);

  return wellFormed ? jwt : null;
}

function _isAdminUser(user: RequestUser): user is SessionAdmin {
  return user !== null && "rules" in user;
}

async function _resolveUserFromJwt(): Promise<RequestUser> {
  const jwt = _bearerJwt();
  if (!jwt) return null;

  const identity = await JwtIdentityResolver.resolveIdentity(jwt);
  if (identity === null) return null;

  if (!identity.isAdmin) {
    const user: SessionUser = { id: identity.id, email: identity.email };
    return user;
  }

  return await _resolveAdmin(identity.id, identity.email);
}

async function _resolveAdmin(
  id: string,
  email: string | null,
): Promise<SessionAdmin | null> {
  if (email === null) {
    console.error(
      `[request-identity] admin "${id}" has no email, refusing the identity`,
    );
    return null;
  }

  const rbac = await AdminRbacResolver.resolve(id);
  if (rbac === null) return null;

  return {
    id,
    email,
    rules: { role: rbac.role, permissions: rbac.permissions },
  };
}

function _currentUser(): Promise<RequestUser> {
  return RequestIdentityCache.remember(_resolveUserFromJwt);
}

export function invalidateAdminRbac(id?: string): Promise<void> {
  return AdminRbacResolver.invalidate(id);
}

export class RequestIdentity {
  static async isConnected(): Promise<boolean> {
    return (await _currentUser()) !== null;
  }

  static async isAdmin(): Promise<boolean> {
    return _isAdminUser(await _currentUser());
  }

  static async isUser(): Promise<boolean> {
    const user = await _currentUser();
    return user !== null && !_isAdminUser(user);
  }

  static async userId(): Promise<string | null> {
    const user = await _currentUser();
    return user?.id ?? null;
  }

  static async role(): Promise<AccountRole | null> {
    const user = await _currentUser();
    if (user === null) return null;
    return _isAdminUser(user) ? AccountRole.Admin : AccountRole.User;
  }

  static get current(): RequestUser {
    return RequestIdentityCache.resolved() ?? null;
  }
}

export class RbacIdentity extends RequestIdentity {
  static async adminRole(): Promise<string | null> {
    const user = await _currentUser();
    return _isAdminUser(user) ? user.rules.role : null;
  }

  static async permissions(): Promise<string[]> {
    const user = await _currentUser();
    return _isAdminUser(user) ? user.rules.permissions : [];
  }
}
