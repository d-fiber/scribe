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
import type { UpdateDynamicLinkInput } from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import { objectOrNull } from "../_shared.ts";
import { AdminDynamicLinkIdEndpoint, expiresAtOrInvalid, payloadOrNull, WRITE_RATE_LIMIT } from "./_shared.ts";

export class AdminDynamicLinkUpdateEndpoint extends AdminDynamicLinkIdEndpoint {
  protected rateLimit() {
    return WRITE_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (this.id === null) return this.invalidId();

    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const patch: UpdateDynamicLinkInput = {};

    if (body.payload !== undefined) {
      const linkPayload = payloadOrNull(body.payload);
      if (!linkPayload) return this.invalidPayload();
      Object.assign(patch, { payload: linkPayload });
    }

    if (body.expires_at !== undefined) {
      const parsed = expiresAtOrInvalid(body.expires_at);
      if (parsed === undefined) return this.invalidExpiresAt();
      Object.assign(patch, { expiresAt: parsed });
    }

    if (Object.keys(patch).length === 0) {
      return this.response.badRequest({
        code: "empty_patch",
        message: "Provide at least one field to update.",
      });
    }

    const result = await clients.devops.dynamicLinks.link.update(this.id, patch);
    if (!result.ok) return this.failure(result.error);

    return this.response.ok();
  }
}
