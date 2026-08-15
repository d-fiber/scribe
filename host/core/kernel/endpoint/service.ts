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

import { Time } from "@scribe/core/contracts/common/time.ts";
import { InternalSecretFirewall } from "@scribe/core/kernel/identity/firewall/internal.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { ApiEndpoint } from "./api.ts";
import { Caller } from "./access.ts";
import type { RateLimiter } from "./rate_limit.ts";

export { Caller } from "./access.ts";
export type { ApiContext } from "./context.ts";
export type { RateLimiter } from "./rate_limit.ts";

export abstract class ServiceEndpoint extends ApiEndpoint {
  protected access(): Caller | readonly Caller[] {
    return Caller.Service;
  }

  protected rateLimit(): RateLimiter {
    return {
      limit: 5000,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.hours(1),
    };
  }

  protected override execute(): Promise<Response> {
    if (!InternalSecretFirewall.verify())
      return Promise.resolve(this.response.unauthorized());
    if (request.isBodyTooLarge())
      return Promise.resolve(this.response.payloadTooLarge());
    return super.execute();
  }
}
