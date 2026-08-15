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
import { RemoteConfigOutcome } from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import { ApiContext } from "@scribe/core/kernel/endpoint/api.ts";
import { APP_REMOTE_CONFIG_CODES, AppRemoteConfigEndpoint, HASH_QUERY, payload } from "./_shared.ts";

export class AppRemoteConfigReadEndpoint extends AppRemoteConfigEndpoint {
  readonly #key: string;

  constructor(key: string) {
    super();
    this.#key = key;
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    if (!this.validKey(this.#key)) return this.invalidKey();

    const result = await clients.devops.remoteConfigs.config.resolveKey(this.#key, this.callerType(ctx));
    if (!result.ok) return this.failure(result.error);

    const config = result.data;
    const known = ctx.query(HASH_QUERY);
    const unchanged = Boolean(known) && known === config.hash;

    await clients.devops.remoteConfigs.statistics.record(
      this.read(config, unchanged ? RemoteConfigOutcome.Unchanged : RemoteConfigOutcome.Served, ctx),
    );

    if (unchanged) {
      return this.response.ok({
        code: APP_REMOTE_CONFIG_CODES.unchanged,
        data: { key: config.key, hash: config.hash },
      });
    }

    return this.response.ok({ data: payload(config) });
  }
}
