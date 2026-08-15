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
import { AdminRemoteConfigEndpoint, payload, READ_RATE_LIMIT } from "./_shared.ts";

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

export class AdminRemoteConfigListEndpoint extends AdminRemoteConfigEndpoint {
  protected rateLimit() {
    return READ_RATE_LIMIT;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const offset = Math.max(0, Math.floor(Number(ctx.query("offset")) || 0));
    const requested = Math.floor(Number(ctx.query("size")) || DEFAULT_PAGE_SIZE);
    const size = Math.min(Math.max(1, requested), MAX_PAGE_SIZE);

    const result = await clients.devops.remoteConfigs.config.pagination({
      offset,
      size,
    });
    if (!result.ok) return this.response.unexpected();

    const page = result.data;
    return this.response.ok({
      data: { configs: page.items.map(payload), pagination: page.pagination },
    });
  }
}
