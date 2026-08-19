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

import type { AccountRole } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { resetPasswordHook, ResetPasswordProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import { RateLimit } from "@scribe/foundation/src/rate_limit/mod.ts";
import { checkCaller } from "@scribe/core/runtime/http/caller.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { isRateLimitCode } from "../../_core/errors.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import { AuthValidator, EmailCheckStatus } from "../../_core/validator.ts";

export enum EmailResetPasswordError {
  EmailRequired = "email_required",
  InvalidEmail = "invalid_email",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type EmailResetPasswordResult = Result<void, EmailResetPasswordError>;

export class EmailResetPassword {
  readonly #caller: RateLimit;
  readonly #recipient: RateLimit;

  constructor(private readonly role: AccountRole) {
    this.#caller = new RateLimit({
      key: `reset-password:email:${role}`,
      limit: 10,
      window: Time.minutes(5),
      penalty: Time.minutes(5),
      maxPenalty: Time.hours(24),
      failOpen: false,
    });
    this.#recipient = new RateLimit({
      key: `reset-password:email:${role}:to`,
      limit: 1,
      window: Time.seconds(90),
      penalty: Time.seconds(90),
      maxPenalty: Time.seconds(90),
      failOpen: false,
    });
  }

  async send(email: string): Promise<EmailResetPasswordResult> {
    const rate = await checkCaller(this.#caller);
    if (!rate.ok) return new Failure(EmailResetPasswordError.TooManyRequests);

    const emailCheck = AuthValidator.email.check(email);
    switch (emailCheck.status) {
      case EmailCheckStatus.Empty:
        return new Failure(EmailResetPasswordError.EmailRequired);
      case EmailCheckStatus.Invalid:
        return new Failure(EmailResetPasswordError.InvalidEmail);
    }
    email = emailCheck.value;

    const recipientRate = await this.#recipient.check("", await sha256Hex(AuthValidator.email.inbox(email)));
    if (!recipientRate.ok) {
      return new Failure(EmailResetPasswordError.TooManyRequests);
    }

    try {
      await resetPasswordHook.run({
        email,
        phone: null,
        role: this.role,
        provider: ResetPasswordProvider.Email,
      });
    } catch {
      return new Failure(EmailResetPasswordError.Unexpected);
    }

    const response = await goTrue.resetPassword.recoverPasswordByEmail(
      email,
      this.role,
    );

    if (!response.ok) {
      if (isRateLimitCode(response.error.code)) return new OK();

      switch (response.error.code) {
        case "validation_failed":
        case "email_address_invalid":
        case "email_address_not_authorized":
          return new Failure(EmailResetPasswordError.InvalidEmail);
        default:
          return new Failure(EmailResetPasswordError.Unexpected);
      }
    }
    return new OK();
  }
}
