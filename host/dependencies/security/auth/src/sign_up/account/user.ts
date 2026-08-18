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

import { database } from "@scribe/foundation/src/database/database.ts";
import type { UserEmailSignUp } from "@scribe/host/dependencies/security/auth/src/sign_up/types.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { identityColumns, type SignUpAccount, type SignUpInsert } from "./account.ts";

export class UserSignUpAccount<
  TInput extends { data: Record<string, unknown> } = UserEmailSignUp,
> implements SignUpAccount<TInput, Record<string, never>> {
  readonly role = AccountRole.User;
  readonly isEmailPreConfirmed = false;

  prepare(): Record<string, never> {
    return {};
  }

  async exists(userId: string): Promise<boolean> {
    const row = await database
      .internal_t__app_users()
      .select((s) => ({ user_id: s.user_id }))
      .where((f) => f.user_id.eq(userId))
      .getOne();
    return row !== null;
  }

  async insert({
    userId,
    identity,
    device,
  }: SignUpInsert<TInput, Record<string, never>>): Promise<boolean> {
    const account = await database.internal_t__app_users().insert({
      user_id: userId,
      ...identityColumns(identity),
    });
    if (!account) return false;

    const [notifications, settings] = await Promise.all([
      database.internal_t__in_app_notification_reads().insert({
        user_id: userId,
        last_read_at: Date.now(),
      }),
      database.internal_t__app_user_settings().insert({
        user_id: userId,
        localization: device.localization,
        theme_mode: device.theme_mode,
      }),
    ]);

    return notifications && settings;
  }

  async delete(userId: string): Promise<void> {
    await database
      .internal_t__app_users()
      .where((f) => f.user_id.eq(userId))
      .delete();
  }
}
