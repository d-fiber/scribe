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

import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { RbacIdentity, RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

async function permissionsOfRole(role: string): Promise<string[]> {
  const rows = await rest
    .internal_t__admin_users_role_permissions()
    .select((s) => ({ permission: s.permission }))
    .where((f) => f.role.eq(role))
    .get();
  return rows.map((r) => r.permission);
}

async function isWithinAuthority(permissions: string[]): Promise<boolean> {
  const own = new Set(await RbacIdentity.permissions());
  return permissions.every((permission) => own.has(permission));
}

export async function canGrantRole(role: string): Promise<boolean> {
  return await isWithinAuthority(await permissionsOfRole(role));
}

export function canGrantPermissions(permissions: string[]): Promise<boolean> {
  return isWithinAuthority(permissions);
}

export async function canEditRole(role: string): Promise<boolean> {
  return await isWithinAuthority(await permissionsOfRole(role));
}

export async function isOwnRole(role: string): Promise<boolean> {
  return (await RbacIdentity.adminRole()) === role;
}

export async function canManageMember(adminId: string): Promise<boolean> {
  const target = await rest
    .internal_t__admin_users()
    .unscoped()
    .select((s) => ({ role: s.role }))
    .where((f) => f.admin_id.eq(adminId))
    .getOne();
  if (!target) return false;

  return await isWithinAuthority(await permissionsOfRole(target.role));
}

export function refuseSelf(): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const adminId = c.req.param("adminId");
    if (adminId && adminId === (await RequestIdentity.userId())) {
      return ServerResponse.forbidden({
        code: "own_account",
        message: "You cannot perform this action on your own account.",
      });
    }
    await next();
  });
}

export function memberAuthority(): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const adminId = c.req.param("adminId");
    if (!adminId || !(await canManageMember(adminId))) {
      return ServerResponse.forbidden({
        code: "not_permitted",
        message: "You cannot act on this team member.",
      });
    }
    await next();
  });
}
