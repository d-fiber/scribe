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
import { ApiContext, ApiEndpoint, Caller, Required } from "@scribe/core/kernel/endpoint/api.ts";
import { invalidateAdminRbac } from "@scribe/core/kernel/identity/request_identity.ts";
import { canEditRole, isOwnRole } from "../_authority.ts";
import { FALLBACK_ROLE, isValidRoleName, normalizeRole, UNDELETABLE_ROLES } from "./_policy.ts";

export class DeleteRoleEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return { limit: 10, window: Time.minutes(1), penalty: Time.minutes(1) };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = ctx.body({ role: Required(String) });
    if (!body) return this.response.badRequest();

    const role = normalizeRole(body.role);

    if (!isValidRoleName(role)) {
      return this.response.badRequest({
        code: "invalid_role",
        message: "The provided role is not valid.",
      });
    }

    if (UNDELETABLE_ROLES.includes(role)) {
      return this.response.forbidden({
        code: "protected_role",
        message: "This role is protected and cannot be deleted.",
      });
    }

    const isRoleExists = await rest
      .internal_t__admin_users_roles()
      .select((s) => ({ role: s.role }))
      .where((f) => f.role.eq(role))
      .getOne();
    if (!isRoleExists) {
      return this.response.notFound({
        code: "role_not_found",
        message: "No role was found with the provided identifier.",
      });
    }

    if (await isOwnRole(role)) {
      return this.response.forbidden({
        code: "own_role",
        message: "You cannot delete the role you hold yourself.",
      });
    }

    if (!(await canEditRole(role))) {
      return this.response.forbidden({
        code: "not_permitted",
        message: "You cannot delete a role that exceeds your own permissions.",
      });
    }

    const { data, error } = await rest.rpc<{ admin_role_delete: string }>(
      "admin_role_delete",
      { p_role: role, p_fallback: FALLBACK_ROLE },
    );
    if (error) {
      console.error("[role:delete] atomic deletion failed", { role, error });
      return this.response.unexpected();
    }

    const migrated = Array.isArray(data) ? (data as string[]) : [];
    await Promise.all(migrated.map((adminId) => invalidateAdminRbac(adminId)));

    return this.response.ok({
      code: "role_deleted",
      message: "The role has been deleted successfully.",
      data: { migrated_to: FALLBACK_ROLE, migrated_admins: migrated.length },
    });
  }
}
