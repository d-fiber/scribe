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
import { VpnAccessLink } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { ApiContext, Required } from "@scribe/core/kernel/endpoint/api.ts";
import { ServiceEndpoint } from "@scribe/core/kernel/endpoint/service.ts";

const VPN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export class CreateVpnEndpoint extends ServiceEndpoint {
  protected async run(ctx: ApiContext): Promise<Response> {
    const body = ctx.body({
      admin_id: Required(String),
      recipient: Required(String),
    });
    if (!body) return this.response.badRequest();

    try {
      const client = await clients.security.vpn.create(body.admin_id);
      if (!client.ok) return this.response.unexpected();

      const url = await VpnAccessLink.issue(body.admin_id);
      if (!url) return this.response.unexpected();

      const expiresAt = Date.now() + VPN_TTL_MS;

      const [created, profile] = await Promise.all([
        rest.internal_t__admin_users_vpn().insert({
          admin_id: body.admin_id,
          vpn_client_id: client.data.id,
          vpn_expires_at: expiresAt,
          vpn_is_active: true,
        }),
        rest
          .internal_t__admin_users_profiles()
          .select((s) => ({ first_name: s.first_name, last_name: s.last_name }))
          .where((f) => f.admin_id.eq(body.admin_id))
          .getOne(),
      ]);

      if (!created) {
        const stillExists = await rest
          .internal_t__admin_users()
          .select((s) => ({ admin_id: s.admin_id }))
          .where((f) => f.admin_id.eq(body.admin_id))
          .getOne();
        if (!stillExists) await clients.security.vpn.delete(client.data.id);
        return this.response.unexpected();
      }

      const sent = await clients.features.messagings.mail.noreply.create(
        body.recipient,
        "admin/account/vpn-access",
        {
          email: body.recipient,
          url,
          firstName: profile?.first_name ?? null,
          lastName: profile?.last_name ?? null,
        },
      );

      if (!sent.ok) {
        console.error("[vpn/create] failed to queue vpn-access mail", {
          admin_id: body.admin_id,
        });
      }

      return this.response.ok();
    } catch (e) {
      console.error("[vpn/create]", e);
      return this.response.unexpected();
    }
  }
}
