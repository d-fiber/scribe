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
import { type Vpn, VpnError } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

export class DownloadEndpoint extends ApiEndpoint {
  protected access(): Caller {
    return Caller.Admin;
  }

  protected rateLimit() {
    return {
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(5),
      failOpen: false,
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const adminId = ctx.id;
    if (!adminId) return this.response.unauthorized();

    const found = await clients.security.vpn.getByOwner(adminId);

    let client: Vpn;
    if (found.ok) {
      client = found.data;
    } else if (found.error === VpnError.NotFound) {
      const created = await clients.security.vpn.create(adminId);
      if (!created.ok) return this.response.unexpected();
      client = created.data;

      await rest
        .internal_t__admin_users_vpn()
        .where((f) => f.admin_id.eq(adminId))
        .update({ vpn_client_id: client.id });
    } else {
      return this.response.unexpected();
    }

    const config = await clients.security.vpn.configuration(client.id);
    if (!config.ok) return this.response.unexpected();

    return this.response.ok({ data: { config: config.data } });
  }
}
