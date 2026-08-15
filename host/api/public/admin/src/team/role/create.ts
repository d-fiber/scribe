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
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Arr, Caller, Required } from "@scribe/core/kernel/endpoint/api.ts";
import { canGrantPermissions } from "../_authority.ts";
import { isValidRoleName, MAX_PERMISSIONS, normalizePermissions, normalizeRole } from "./_policy.ts";

export class CreateRoleEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return { limit: 10, window: Time.minutes(1), penalty: Time.minutes(1) };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = ctx.body({
      role: Required(String),
      permissions: Arr(String),
    });
    if (!body) return this.response.badRequest();

    const role = normalizeRole(body.role);
    const permissions = normalizePermissions(body.permissions ?? []);

    if (!isValidRoleName(role)) {
      return this.response.badRequest({
        code: "invalid_role",
        message: "Role name must be between 1 and 50 characters.",
      });
    }
    if (permissions.length == 0 || permissions.length > MAX_PERMISSIONS) {
      return this.response.badRequest({
        code: "invalid_permissions",
        message: "At least one permission is required (max 200).",
      });
    }

    const [isRoleExists, remotePermissions] = await Promise.all([
      rest
        .internal_t__admin_users_roles()
        .select((s) => ({ role: s.role }))
        .where((f) => f.role.eq(role))
        .getOne(),
      rest
        .internal_t__admin_users_permissions()
        .select((s) => ({ permission: s.permission }))
        .get(),
    ]);

    if (isRoleExists) {
      return this.response.conflict({
        code: "role_already_exists",
        message: "A role with this name already exists.",
      });
    }

    const knownPermissions = new Set(
      remotePermissions.map((row) => row.permission),
    );
    const unknownPermission = permissions.find(
      (permission) => !knownPermissions.has(permission),
    );
    if (unknownPermission) {
      return this.response.badRequest({
        code: "invalid_permissions",
        message: "One or more permissions do not exist.",
      });
    }

    if (!(await canGrantPermissions(permissions))) {
      return this.response.forbidden({
        code: "not_permitted",
        message: "You cannot grant a permission you do not hold yourself.",
      });
    }

    const { error } = await rest.rpc("admin_role_create", {
      p_role: role,
      p_permissions: permissions,
    });
    if (error) {
      console.error("[role:create] atomic creation failed", { role, error });
      return this.response.unexpected();
    }

    return this.response.created({
      code: "role_created",
      message: "The role has been created successfully.",
    });
  }
}
