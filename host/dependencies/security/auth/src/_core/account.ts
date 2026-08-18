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

import { rest } from "@scribe/host/packages/foundation/database/rest/rest.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { AuthCache } from "./cache.ts";

export class AccountRoleResolver {
  static async withEmail(email: string): Promise<AccountRole | null> {
    const cached = await AuthCache.role.getByEmail(email);
    if (cached !== null) return cached;

    const resolved = await this.#resolve(
      rest
        .internal_t__app_users()
        .unscoped()
        .select((s) => ({ user_id: s.user_id }))
        .where((f) => [f.email.eq(email), f.is_email_verified.eq(true)])
        .getOne(),
      rest
        .internal_t__admin_users()
        .unscoped()
        .select((s) => ({ admin_id: s.admin_id }))
        .where((f) => [f.email.eq(email), f.is_email_verified.eq(true)])
        .getOne(),
    );

    if (resolved === null) return null;

    await AuthCache.role.setByEmail(resolved.userId, email, resolved.role);
    return resolved.role;
  }

  static async withPhone(phone: string): Promise<AccountRole | null> {
    const cached = await AuthCache.role.getByPhone(phone);
    if (cached !== null) return cached;

    const resolved = await this.#resolve(
      rest
        .internal_t__app_users()
        .unscoped()
        .select((s) => ({ user_id: s.user_id }))
        .where((f) => [f.phone.eq(phone), f.is_phone_verified.eq(true)])
        .getOne(),
      rest
        .internal_t__admin_users()
        .unscoped()
        .select((s) => ({ admin_id: s.admin_id }))
        .where((f) => [f.phone.eq(phone), f.is_phone_verified.eq(true)])
        .getOne(),
    );

    if (resolved === null) return null;

    await AuthCache.role.setByPhone(resolved.userId, phone, resolved.role);
    return resolved.role;
  }

  static async withId(userId: string): Promise<AccountRole | null> {
    const cached = await AuthCache.role.getById(userId);
    if (cached !== null) return cached;

    const resolved = await this.#resolve(
      rest
        .internal_t__app_users()
        .unscoped()
        .select((s) => ({ user_id: s.user_id }))
        .where((f) => f.user_id.eq(userId))
        .getOne(),
      rest
        .internal_t__admin_users()
        .unscoped()
        .select((s) => ({ admin_id: s.admin_id }))
        .where((f) => f.admin_id.eq(userId))
        .getOne(),
    );

    if (resolved === null) return null;

    await AuthCache.role.setById(userId, resolved.role);
    return resolved.role;
  }

  static invalidate(userId: string): Promise<void> {
    return AuthCache.role.invalidateId(userId);
  }

  static async #resolve(
    userMatch: Promise<{ user_id: string } | null>,
    adminMatch: Promise<{ admin_id: string } | null>,
  ): Promise<{ role: AccountRole; userId: string } | null> {
    const [user, admin] = await Promise.all([userMatch, adminMatch]);

    if (user && admin) {
      console.error(
        "[account-role] identifier found in both app_users and admin_users, resolution refused",
      );
      return null;
    }

    if (user) return { role: AccountRole.User, userId: user.user_id };
    if (admin) return { role: AccountRole.Admin, userId: admin.admin_id };
    return null;
  }
}
