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
import { AuthCache, SmsIntent } from "../../_core/cache.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { isRateLimitCode } from "../../_core/errors.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import { AuthMapper } from "../../_core/mappers.ts";
import { PendingToken, PendingTokenPurpose } from "../../_core/pending_token.ts";
import { AccountRevocation } from "../../_core/revocation.ts";
import { AuthValidator } from "../../_core/validator.ts";

enum DispatchScope {
  Send = "send",
  Resend = "resend",
}

export enum VerifyPhoneResetOtpError {
  InvalidOrExpired = "invalid_or_expired",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type VerifyPhoneResetOtpResult = Result<
  { resetToken: string },
  VerifyPhoneResetOtpError
>;

export enum PhoneResetPasswordError {
  PhoneRequired = "phone_required",
  InvalidPhone = "invalid_phone",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type PhoneResetPasswordResult = Result<void, PhoneResetPasswordError>;

export class PhoneResetPassword {
  readonly #token = new PendingToken(PendingTokenPurpose.PasswordReset);
  readonly #verify: RateLimit;
  readonly #caller: Readonly<Record<DispatchScope, RateLimit>>;
  readonly #recipient: Readonly<Record<DispatchScope, RateLimit>>;

  constructor(private readonly role: AccountRole) {
    this.#verify = new RateLimit({
      key: `reset-password:phone:${role}:verify:to`,
      limit: 5,
      window: Time.minutes(10),
      penalty: Time.minutes(10),
      maxPenalty: Time.hours(1),
      failOpen: false,
    });
    this.#caller = {
      [DispatchScope.Send]: PhoneResetPassword.#callerLimit(role, DispatchScope.Send),
      [DispatchScope.Resend]: PhoneResetPassword.#callerLimit(role, DispatchScope.Resend),
    };
    this.#recipient = {
      [DispatchScope.Send]: PhoneResetPassword.#recipientLimit(role, DispatchScope.Send),
      [DispatchScope.Resend]: PhoneResetPassword.#recipientLimit(role, DispatchScope.Resend),
    };
  }

  static #callerLimit(role: AccountRole, scope: DispatchScope): RateLimit {
    return new RateLimit({
      key: `reset-password:phone:${role}:${scope}`,
      limit: 10,
      window: Time.minutes(5),
      penalty: Time.minutes(5),
      maxPenalty: Time.hours(24),
      failOpen: false,
    });
  }

  static #recipientLimit(role: AccountRole, scope: DispatchScope): RateLimit {
    return new RateLimit({
      key: `reset-password:phone:${role}:${scope}:to`,
      limit: 1,
      window: Time.seconds(90),
      penalty: Time.seconds(90),
      maxPenalty: Time.seconds(90),
      failOpen: false,
    });
  }

  send(phone: string): Promise<PhoneResetPasswordResult> {
    return this.dispatch(phone, DispatchScope.Send);
  }

  resend(phone: string): Promise<PhoneResetPasswordResult> {
    return this.dispatch(phone, DispatchScope.Resend);
  }

  private async dispatch(
    phone: string,
    scope: DispatchScope,
  ): Promise<PhoneResetPasswordResult> {
    const rate = await checkCaller(this.#caller[scope]);
    if (!rate.ok) return new Failure(PhoneResetPasswordError.TooManyRequests);

    if (phone.trim().length === 0) {
      return new Failure(PhoneResetPasswordError.PhoneRequired);
    }
    const phoneValue = AuthValidator.phone.format(phone);
    if (!AuthValidator.phone.isValid(phoneValue)) {
      return new Failure(PhoneResetPasswordError.InvalidPhone);
    }

    const recipientRate = await this.#recipient[scope].check("", await sha256Hex(phone));
    if (!recipientRate.ok) {
      return new Failure(PhoneResetPasswordError.TooManyRequests);
    }

    try {
      await resetPasswordHook.run({
        email: null,
        phone: phoneValue,
        role: this.role,
        provider: ResetPasswordProvider.Phone,
      });
    } catch {
      return new Failure(PhoneResetPasswordError.Unexpected);
    }

    await AuthCache.smsIntent.mark(phoneValue, SmsIntent.ResetPassword);

    const response = await goTrue.signIn.phone.send(
      phoneValue,
      this.role,
      false,
    );

    if (!response.ok) {
      await AuthCache.smsIntent.consume(phoneValue);
      if (isRateLimitCode(response.error.code)) return new OK();
      return new Failure(PhoneResetPasswordError.Unexpected);
    }

    return new OK();
  }

  async verify(phone: string, otp: string): Promise<VerifyPhoneResetOtpResult> {
    if (!/^[0-9]{6}$/.test(otp)) {
      return new Failure(VerifyPhoneResetOtpError.InvalidOrExpired);
    }

    const phoneValue = AuthValidator.phone.format(phone);
    if (!AuthValidator.phone.isValid(phoneValue)) {
      return new Failure(VerifyPhoneResetOtpError.InvalidOrExpired);
    }

    const rate = await this.#verify.check("", await sha256Hex(phone));
    if (!rate.ok) return new Failure(VerifyPhoneResetOtpError.TooManyRequests);

    const response = await goTrue.signIn.phone.verify(phoneValue, otp);

    if (!response.ok) {
      return new Failure(
        isRateLimitCode(response.error.code)
          ? VerifyPhoneResetOtpError.TooManyRequests
          : VerifyPhoneResetOtpError.InvalidOrExpired,
      );
    }

    const session = AuthMapper.account.session(response.data);
    const accessToken = session.access_token;
    if (!session.user || !accessToken) {
      return new Failure(VerifyPhoneResetOtpError.Unexpected);
    }

    await AccountRevocation.session(accessToken);

    if (AuthMapper.account.role(response.data) !== this.role) {
      return new Failure(VerifyPhoneResetOtpError.InvalidOrExpired);
    }

    const resetToken = await this.#token.issue(phoneValue, this.role, null);
    if (!resetToken) return new Failure(VerifyPhoneResetOtpError.Unexpected);

    return new OK({ resetToken });
  }
}
