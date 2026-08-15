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

import { AvatarType } from "@scribe/core/contracts/enums.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { accountStorage } from "@scribe/host/dependencies/security/auth/src/user/storage/account_storage.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

const DEFAULT_BACKGROUND_COLOR = "#6B7280";

export class DeleteAvatarImageEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(2),
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const adminId = ctx.id;
    if (!adminId) return this.response.unauthorized();

    const profile = await rest
      .internal_t__admin_users_profiles()
      .select((s) => ({
        first_name: s.first_name,
        last_name: s.last_name,
        avatar_background_color: s.avatar_background_color,
      }))
      .where((f) => f.admin_id.eq(adminId))
      .getOne();
    if (!profile) return this.response.notFound();

    const initials = (profile.first_name[0] ?? "").toUpperCase() +
      (profile.last_name[0] ?? "").toUpperCase();

    const removed = await accountStorage.admin.avatar.remove();
    if (!removed.ok) return this.response.unexpected();

    const backgroundColor = profile.avatar_background_color ?? DEFAULT_BACKGROUND_COLOR;

    const ok = await rest
      .internal_t__admin_users_profiles()
      .where((f) => f.admin_id.eq(adminId))
      .update({
        avatar_type: AvatarType.TEXT,
        avatar_text: initials,
        avatar_background_color: backgroundColor,
        avatar_url: null,
        avatar_blur_hash: null,
        avatar_placeholder: null,
      });
    if (!ok) return this.response.unexpected();

    return this.response.ok();
  }
}
