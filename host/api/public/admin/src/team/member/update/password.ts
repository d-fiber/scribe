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
import { Time } from "@scribe/core/contracts/common/time.ts";
import { UpdateUserPasswordError } from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { ApiContext, ApiEndpoint, Caller, Required } from "@scribe/core/kernel/endpoint/api.ts";

export class UpdateMemberPasswordEndpoint extends ApiEndpoint {
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
      maxPenalty: Time.minutes(30),
    };
  }

  protected async run(ctx: ApiContext): Promise<Response> {
    const body = ctx.body({
      current: Required(String),
      newPassword: Required(String),
      confirmNewPassword: Required(String),
    });
    if (!body) return this.response.badRequest();

    const result = await clients.security.auth.user.password.update(
      this.#adminId,
      body.current,
      body.newPassword,
      body.confirmNewPassword,
    );

    if (result instanceof Failure) {
      switch (result.error) {
        case UpdateUserPasswordError.PasswordsDoNotMatch:
          return this.response.badRequest({
            code: "passwords_do_not_match",
            message: "New password and confirmation do not match.",
          });
        case UpdateUserPasswordError.SameAsCurrentPassword:
          return this.response.badRequest({
            code: "same_as_current_password",
            message: "New password must be different from the current one.",
          });
        case UpdateUserPasswordError.InvalidPassword:
          return this.response.badRequest({
            code: "invalid_password",
            message:
              "Password must be between 10 and 128 characters, include an uppercase letter, a lowercase letter and a number, and avoid repeated or sequential runs.",
          });
        case UpdateUserPasswordError.InvalidCurrentPassword:
          return this.response.badRequest({
            code: "invalid_current_password",
            message: "Current password is incorrect.",
          });
        default:
          return this.response.unexpected();
      }
    }

    return this.response.ok();
  }
}
