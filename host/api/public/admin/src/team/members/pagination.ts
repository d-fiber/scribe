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
import { MemberPreview } from "@scribe/core/contracts/admin/preview.ts";
import { Avatar } from "@scribe/core/contracts/common/avatar.ts";
import { AvatarType } from "@scribe/core/contracts/enums.ts";
import { pagination } from "@scribe/core/contracts/pagination.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

const PAGE_SIZE = 30;

export class AdminsPaginationEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 20,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
    };
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    const params = new URL(RequestScope.get().url).searchParams;
    const offset = Math.max(0, Number(params.get("offset") ?? 0));

    const rows = await rest
      .internal_t__admin_users()
      .unscoped()
      .select((s) => ({
        admin_id: s.admin_id,
        role: s.role,
        email: s.email,
        admin_users_profiles: s.embed("internal_t__admin_users_profiles", (p) => ({
          avatar_type: p.avatar_type,
          avatar_url: p.avatar_url,
          avatar_blur_hash: p.avatar_blur_hash,
          avatar_text: p.avatar_text,
          avatar_background_color: p.avatar_background_color,
          avatar_placeholder: p.avatar_placeholder,
          first_name: p.first_name,
          last_name: p.last_name,
        })),
      }))
      .order("first_name" as never, {
        foreignTable: "internal_t__admin_users_profiles",
        ascending: true,
      })
      .order("last_name" as never, {
        foreignTable: "internal_t__admin_users_profiles",
        ascending: true,
      })
      .range(offset, offset + PAGE_SIZE)
      .get();

    if (!rows) return this.response.unexpected();

    const items: MemberPreview[] = rows.map((row) => {
      const p = row.admin_users_profiles!;

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

      return {
        admin_id: row.admin_id,
        role: row.role,
        email: row.email,
        firstname: p.first_name,
        lastname: p.last_name,
        avatar,
      };
    });

    return this.response.ok({ data: pagination(items, offset, PAGE_SIZE) });
  }
}
