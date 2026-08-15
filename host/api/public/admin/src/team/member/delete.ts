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

import { Failure } from "@scribe/core/contracts/result.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { invalidateAdminRbac } from "@scribe/core/kernel/identity/request_identity.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

export class AdminDeleteTeamMemberEndpoint extends ApiEndpoint {
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
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
    };
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    const admin = await rest
      .internal_t__admin_users()
      .unscoped()
      .select((s) => ({
        admin_id: s.admin_id,
        role: s.role,
      }))
      .where((f) => f.admin_id.eq(this.#adminId))
      .getOne();

    if (!admin) return this.response.notFound();

    const result = await clients.security.auth.user.delete(this.#adminId);
    if (result instanceof Failure) return this.response.unexpected();

    const purged = await clients.security.vpn.deleteAll(this.#adminId);
    if (!purged.ok) {
      console.error(
        "[team/member/delete] vpn.deleteAll failed, peers may still grant network access",
        { admin_id: this.#adminId },
      );
    }

    await invalidateAdminRbac(this.#adminId);

    return this.response.ok();
  }
}
