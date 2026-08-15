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
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import {
  AdminRemoteConfigEndpoint,
  audienceMessage,
  audienceOrNull,
  KEY_PATTERN,
  objectOrNull,
  payload,
  WRITE_RATE_LIMIT,
} from "./_shared.ts";

export class AdminRemoteConfigCreateEndpoint extends AdminRemoteConfigEndpoint {
  protected rateLimit() {
    return WRITE_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = objectOrNull(ctx.raw());
    if (!body) return this.invalidBody();

    const key = typeof body.key === "string" ? body.key.trim() : "";
    if (!KEY_PATTERN.test(key)) return this.invalidKey();

    const value = objectOrNull(body.value);
    if (!value) {
      return this.response.badRequest({
        code: "invalid_value",
        message: "`value` must be a JSON object.",
      });
    }

    const audience = audienceOrNull(body.audience);
    if (body.audience !== undefined && !audience) {
      return this.response.badRequest({
        code: "invalid_audience",
        message: audienceMessage(),
      });
    }

    const result = await clients.devops.remoteConfigs.config.add({
      key,
      value,
      ...(audience ? { audience } : {}),
      ...(typeof body.description === "string" ? { description: body.description } : {}),
      ...(typeof body.is_active === "boolean" ? { isActive: body.is_active } : {}),
    });
    if (!result.ok) return this.response.unexpected();

    return this.response.created({ data: payload(result.data) });
  }
}
