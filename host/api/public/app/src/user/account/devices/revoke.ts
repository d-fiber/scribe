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
import { RevokeDeviceError } from "@scribe/host/dependencies/security/auth/src/session/session.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { ApiContext, ApiEndpoint, Caller } from "@scribe/core/kernel/endpoint/api.ts";

export class RevokeDeviceEndpoint extends ApiEndpoint {
  readonly #deviceId: string;

  constructor(deviceId: string) {
    super();
    this.#deviceId = deviceId;
  }

  protected access(): Caller {
    return Caller.User;
  }

  protected rateLimit() {
    return {
      limit: 10,
      window: Time.minutes(5),
      penalty: Time.minutes(5),
      maxPenalty: Time.hours(1),
      failOpen: false,
    };
  }

  protected async run(_ctx: ApiContext): Promise<Response> {
    const result = await clients.security.auth.session.device.revoke(
      this.#deviceId,
    );

    if (!result.ok) {
      switch (result.error) {
        case RevokeDeviceError.Unauthorized:
          return this.response.unauthorized();
        case RevokeDeviceError.NotFound:
          return this.response.notFound();
        case RevokeDeviceError.CurrentDevice:
          return this.response.badRequest({
            code: "current_device",
            message: "You cannot revoke the device you are signed in on. Use sign-out instead.",
          });
        default:
          return this.response.unexpected();
      }
    }

    return this.response.ok();
  }
}
