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

import { clients } from "@scribe/host/dependencies/clients.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { VpnAccessLink } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { Env } from "@scribe/host/env.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

const VPN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export class AdminRenewTeamMemberVpnEndpoint extends ApiEndpoint {
  readonly #adminId: string;

  constructor(adminId: string) {
    super();
    this.#adminId = adminId;
  }

  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 5,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(5),
    };
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    const [admin, profile] = await Promise.all([
      rest
        .internal_t__admin_users()
        .unscoped()
        .select((s) => ({ admin_id: s.admin_id, email: s.email }))
        .where((f) => f.admin_id.eq(this.#adminId))
        .getOne(),
      rest
        .internal_t__admin_users_profiles()
        .unscoped()
        .select((s) => ({ first_name: s.first_name, last_name: s.last_name }))
        .where((f) => f.admin_id.eq(this.#adminId))
        .getOne(),
    ]);

    if (!admin || !profile) return this.response.notFound();

    try {
      const deleted = await clients.security.vpn.deleteAll(this.#adminId);
      if (!deleted.ok) {
        console.error("[renew-vpn] vpn.deleteAll failed", {
          admin_id: this.#adminId,
        });
      }

      const client = await clients.security.vpn.create(this.#adminId);
      if (!client.ok) return this.response.unexpected();

      const url = await VpnAccessLink.issue(this.#adminId);
      if (!url) return this.response.unexpected();

      const expiresAt = Date.now() + VPN_TTL_MS;

      await rest
        .internal_t__admin_users_vpn()
        .unscoped()
        .where((f) => f.admin_id.eq(this.#adminId))
        .update({
          vpn_client_id: client.data.id,
          vpn_expires_at: expiresAt,
          vpn_is_active: true,
        });

      const emailRes = await fetch("http://api:3000/messaging/email/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": Env.INTERNAL_SECRET,
        },
        body: JSON.stringify({
          to: admin.email,
          template_name: "admin/account/vpn-access",
          account: "noreply",
          data: {
            email: admin.email,
            url,
            firstName: profile.first_name,
            lastName: profile.last_name,
          },
        }),
      });

      if (!emailRes.ok) {
        console.error("[renew-vpn] vpn-access email hook failed", {
          admin_id: this.#adminId,
          status: emailRes.status,
        });
      }

      return this.response.ok();
    } catch (e) {
      console.error("[renew-vpn] failed", { admin_id: this.#adminId, error: e });
      return this.response.unexpected();
    }
  }
}
