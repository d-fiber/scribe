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
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

const VPN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export class RenewEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 5,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(5),
      failOpen: false,
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const adminId = ctx.id;
    if (!adminId) return this.response.unauthorized();

    const deleted = await clients.security.vpn.deleteAll(adminId);
    if (!deleted.ok) {
      console.error("[user/vpn/renew] deleteAll failed", { admin_id: adminId });
      return this.response.unexpected();
    }

    const created = await clients.security.vpn.create(adminId);
    if (!created.ok) {
      console.error("[user/vpn/renew] create failed", { admin_id: adminId });
      return this.response.unexpected();
    }

    await rest
      .internal_t__admin_users_vpn()
      .where((f) => f.admin_id.eq(adminId))
      .update({
        vpn_client_id: created.data.id,
        vpn_expires_at: Date.now() + VPN_TTL_MS,
        vpn_is_active: true,
      });

    return this.response.ok();
  }
}
