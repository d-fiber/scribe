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
import type { UpdateRemoteConfigInput } from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import {
  AdminRemoteConfigKeyEndpoint,
  audienceMessage,
  audienceOrNull,
  objectOrNull,
  WRITE_RATE_LIMIT,
} from "./_shared.ts";

export class AdminRemoteConfigUpdateEndpoint extends AdminRemoteConfigKeyEndpoint {
  protected rateLimit() {
    return WRITE_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (!this.validKey()) return this.invalidKey();

    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const patch: Record<string, unknown> = {};

    if (body.value !== undefined) {
      const value = objectOrNull(body.value);
      if (!value) {
        return this.response.badRequest({
          code: "invalid_value",
          message: "`value` must be a JSON object.",
        });
      }
      patch.value = value;
    }

    if (body.audience !== undefined) {
      const audience = audienceOrNull(body.audience);
      if (!audience) {
        return this.response.badRequest({
          code: "invalid_audience",
          message: audienceMessage(),
        });
      }
      patch.audience = audience;
    }

    if (body.description !== undefined) {
      patch.description = typeof body.description === "string" ? body.description : null;
    }

    if (body.is_active !== undefined) {
      if (typeof body.is_active !== "boolean") {
        return this.response.badRequest({
          code: "invalid_is_active",
          message: "`is_active` must be a boolean.",
        });
      }
      patch.isActive = body.is_active;
    }

    if (Object.keys(patch).length === 0) {
      return this.response.badRequest({
        code: "empty_patch",
        message: "Provide at least one field to update.",
      });
    }

    const result = await clients.devops.remoteConfigs.config.update(
      this.key,
      patch as UpdateRemoteConfigInput,
    );
    if (!result.ok) return this.notFoundOrUnexpected(result.error);

    return this.response.ok();
  }
}
