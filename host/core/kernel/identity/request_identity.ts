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
