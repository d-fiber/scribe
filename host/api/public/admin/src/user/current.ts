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

import { accountStorage } from "@scribe/host/dependencies/security/auth/src/user/storage/account_storage.ts";
import { Admin } from "@scribe/core/contracts/admin/admin.ts";
import { Avatar } from "@scribe/core/contracts/common/avatar.ts";
import { AvatarType } from "@scribe/core/contracts/enums.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";

export class CurrentAdminEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 50,
      window: Time.minutes(5),
      penalty: Time.minutes(5),
      maxPenalty: Time.minutes(15),
      failOpen: false,
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (!ctx.id) return this.response.unauthorized();

    const data = await rest
      .internal_t__admin_users()
      .select((s) => ({
        admin_id: s.admin_id,
        role: s.role,
        email: s.email,
        is_email_verified: s.is_email_verified,
        phone: s.phone,
        is_phone_verified: s.is_phone_verified,
        created_at: s.created_at,
        updated_at: s.updated_at,
        admin_users_profiles: s.embed(
          "internal_t__admin_users_profiles",
          (p) => ({
            avatar_type: p.avatar_type,
            avatar_url: p.avatar_url,
            avatar_blur_hash: p.avatar_blur_hash,
            avatar_text: p.avatar_text,
            avatar_background_color: p.avatar_background_color,
            avatar_placeholder: p.avatar_placeholder,
            first_name: p.first_name,
            last_name: p.last_name,
            gender: p.gender,
            birthday: p.birthday,
          }),
        ),
        admin_users_settings: s.embed(
          "internal_t__admin_users_settings",
          (settings) => ({
            localization: settings.localization,
            theme_mode: settings.theme_mode,
          }),
        ),
        admin_users_vpn: s.embed("internal_t__admin_users_vpn", (v) => ({
          vpn_client_id: v.vpn_client_id,
          vpn_expires_at: v.vpn_expires_at,
        })),
      }))
      .where((f) => f.admin_id.eq(ctx.id!))
      .getOne();

    if (!data) return this.response.notFound();

    const p = data.admin_users_profiles;
    const s = data.admin_users_settings;
    const v = data.admin_users_vpn;
    if (!p || !s) return this.response.notFound();

    let avatar: Avatar = { type: AvatarType.PLACEHOLDER, placeholder: "" };
    if (p.avatar_type === AvatarType.PHOTO && p.avatar_url) {
      avatar = {
        type: AvatarType.PHOTO,
        url: accountStorage.admin.avatar.urlOf(p.avatar_url),
        blur_hash: p.avatar_blur_hash,
      };
    } else if (p.avatar_type === AvatarType.TEXT && p.avatar_text) {
      avatar = {
        type: AvatarType.TEXT,
        text: p.avatar_text,
        background_color: p.avatar_background_color!,
      };
    } else if (
      p.avatar_type === AvatarType.PLACEHOLDER &&
      p.avatar_placeholder
    ) {
      avatar = {
        type: AvatarType.PLACEHOLDER,
        placeholder: p.avatar_placeholder,
      };
    }

    const admin: Admin = {
      admin_id: data.admin_id,
      role: data.role,
      profile: {
        avatar,
        email: { value: data.email, is_email_verified: data.is_email_verified },
        phone: { value: data.phone, is_phone_verified: data.is_phone_verified },
        name: { firstname: p.first_name, lastname: p.last_name },
        gender: p.gender,
        birthday: p.birthday,
      },
      settings: { localization: s.localization, theme_mode: s.theme_mode },
      vpn: {
        client_id: v?.vpn_client_id ?? null,
        expires_at: v?.vpn_expires_at ?? null,
      },
      metadata: { created_at: data.created_at, updated_at: data.updated_at },
    };

    return this.response.ok({ data: admin });
  }
}
