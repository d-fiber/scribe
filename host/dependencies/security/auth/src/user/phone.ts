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

import { AuthCache, SmsIntent } from "@scribe/host/dependencies/security/auth/src/_core/cache.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import type { AuthError } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/transport.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import { AuthValidator, PhoneCheckStatus } from "@scribe/host/dependencies/security/auth/src/_core/validator.ts";
import { DevicesClient } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { CurrentSessionResolver } from "@scribe/host/dependencies/security/auth/src/_core/current_session.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { rateLimiter, type RateLimitResult, RateLimitScope } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";

import { updateUserPhoneHook } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export type { UpdatePhoneHook, UpdatePhoneHookPayload } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export { updateUserPhoneHook };

export enum UpdateUserPhoneError {
  InvalidPhone = "invalid_phone",
  Conflict = "conflict",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type UpdateUserPhoneResult = Result<void, UpdateUserPhoneError>;

export enum ConfirmUserPhoneError {
  InvalidOrExpired = "invalid_or_expired",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type ConfirmUserPhoneResult = Result<void, ConfirmUserPhoneError>;

export class UserPhoneClient {
  readonly #devices = new DevicesClient();

  private checkCallerRateLimit(): Promise<RateLimitResult> {
    return rateLimiter.check({
      key: `user:phone`,
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(30),
      failOpen: false,
    });
  }

  private async checkTargetRateLimit(userId: string): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:phone:of:${await sha256Hex(userId)}`,
      limit: 5,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.minutes(15),
      failOpen: false,
      scope: RateLimitScope.Global,
    });
  }

  async update(userId: string, phone: string): Promise<UpdateUserPhoneResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session || session.userId !== userId) {
      return new Failure(UpdateUserPhoneError.Unexpected);
    }

    return await this.#update(
      userId,
      phone,
      async (value) => {
        await AuthCache.smsIntent.mark(value, SmsIntent.ChangePhone);
        const response = await goTrue.session.updateIdentifier(session.token, {
          phone: value,
        });
        if (!response.ok) await AuthCache.smsIntent.consume(value);
        return response;
      },
      false,
      false,
    );
  }

  async confirmChange(
    userId: string,
    phone: string,
    otp: string,
  ): Promise<ConfirmUserPhoneResult> {
    if (!/^[0-9]{6}$/.test(otp)) {
      return new Failure(ConfirmUserPhoneError.InvalidOrExpired);
    }

    const phoneValue = AuthValidator.phone.format(phone);
    if (!AuthValidator.phone.isValid(phoneValue)) {
      return new Failure(ConfirmUserPhoneError.InvalidOrExpired);
    }

    const rate = await this.checkConfirmRateLimit(phoneValue);
    if (!rate.ok) return new Failure(ConfirmUserPhoneError.TooManyRequests);

    const response = await goTrue.session.verifyPhoneChange(phoneValue, otp);
    if (!response.ok) {
      return new Failure(ConfirmUserPhoneError.InvalidOrExpired);
    }

    return await this.#commit(userId, phoneValue, false) ? new OK() : new Failure(ConfirmUserPhoneError.Unexpected);
  }

  updateAsAdmin(userId: string, phone: string): Promise<UpdateUserPhoneResult> {
    return this.#update(
      userId,
      phone,
      (value) => goTrue.user.phone.update(userId, value),
      true,
      true,
    );
  }

  private async checkConfirmRateLimit(phone: string): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:phone:confirm:to:${await sha256Hex(phone)}`,
      limit: 5,
      window: Time.minutes(10),
      penalty: Time.minutes(10),
      maxPenalty: Time.hours(1),
      failOpen: false,
      scope: RateLimitScope.Global,
    });
  }

  async #commit(
    userId: string,
    phone: string,
    revokeSessions: boolean,
  ): Promise<boolean> {
    await AccountRevocation.caches(userId);

    if (revokeSessions) {
      await this.#devices.endAllSessions(userId);
    }

    try {
      await updateUserPhoneHook.run({ userId, phone });
    } catch {
      console.error(
        `[user-phone] divergence: phone of ${userId} was updated but updateUserPhoneHook failed`,
      );
      return false;
    }
    return true;
  }

  async #update(
    userId: string,
    phone: string,
    apply: (phone: string) => Promise<Result<unknown, AuthError>>,
    revokeSessions: boolean,
    commit: boolean,
  ): Promise<UpdateUserPhoneResult> {
    const rate = await this.checkCallerRateLimit();
    if (!rate.ok) return new Failure(UpdateUserPhoneError.TooManyRequests);

    const phoneCheck = AuthValidator.phone.check(phone);
    if (phoneCheck.status !== PhoneCheckStatus.Ok) {
      return new Failure(UpdateUserPhoneError.InvalidPhone);
    }

    const targetRate = await this.checkTargetRateLimit(userId);
    if (!targetRate.ok) {
      return new Failure(UpdateUserPhoneError.TooManyRequests);
    }

    const response = await apply(phoneCheck.value);

    if (!response.ok) {
      if (
        response.error.code === "phone_exists" ||
        response.error.code === "user_already_exists"
      ) {
        return new Failure(UpdateUserPhoneError.Conflict);
      }
      return new Failure(UpdateUserPhoneError.Unexpected);
    }

    if (!commit) return new OK();

    return await this.#commit(userId, phoneCheck.value, revokeSessions)
      ? new OK()
      : new Failure(UpdateUserPhoneError.Unexpected);
  }
}
