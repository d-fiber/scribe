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

import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import type { AuthError } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/transport.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import { AuthValidator, EmailCheckStatus } from "@scribe/host/dependencies/security/auth/src/_core/validator.ts";
import { DevicesClient } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { CurrentSessionResolver } from "@scribe/host/dependencies/security/auth/src/_core/current_session.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { rateLimiter, type RateLimitResult, RateLimitScope } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";

import { updateUserEmailHook } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export type { UpdateEmailHook, UpdateEmailHookPayload } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export { updateUserEmailHook };

export enum UpdateUserEmailError {
  InvalidEmail = "invalid_email",
  Conflict = "conflict",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type UpdateUserEmailResult = Result<void, UpdateUserEmailError>;

export class UserEmailClient {
  readonly #devices = new DevicesClient();

  private checkCallerRateLimit(): Promise<RateLimitResult> {
    return rateLimiter.check({
      key: `user:email`,
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(30),
      failOpen: false,
    });
  }

  private async checkTargetRateLimit(userId: string): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:email:of:${await sha256Hex(userId)}`,
      limit: 5,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.minutes(15),
      failOpen: false,
      scope: RateLimitScope.Global,
    });
  }

  async update(userId: string, email: string): Promise<UpdateUserEmailResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session || session.userId !== userId) {
      return new Failure(UpdateUserEmailError.Unexpected);
    }

    return await this.#update(
      userId,
      email,
      (value) => goTrue.session.updateIdentifier(session.token, { email: value }),
      false,
    );
  }

  updateAsAdmin(userId: string, email: string): Promise<UpdateUserEmailResult> {
    return this.#update(
      userId,
      email,
      (value) => goTrue.user.email.update(userId, value),
      true,
    );
  }

  async #update(
    userId: string,
    email: string,
    apply: (email: string) => Promise<Result<unknown, AuthError>>,
    revokeSessions: boolean,
  ): Promise<UpdateUserEmailResult> {
    const rate = await this.checkCallerRateLimit();
    if (!rate.ok) return new Failure(UpdateUserEmailError.TooManyRequests);

    const emailCheck = AuthValidator.email.check(email);
    if (emailCheck.status !== EmailCheckStatus.Ok) {
      return new Failure(UpdateUserEmailError.InvalidEmail);
    }

    const targetRate = await this.checkTargetRateLimit(userId);
    if (!targetRate.ok) {
      return new Failure(UpdateUserEmailError.TooManyRequests);
    }

    const response = await apply(emailCheck.value);

    if (!response.ok) {
      if (
        response.error.code === "email_exists" ||
        response.error.code === "user_already_exists"
      ) {
        return new Failure(UpdateUserEmailError.Conflict);
      }
      return new Failure(UpdateUserEmailError.Unexpected);
    }

    await AccountRevocation.caches(userId);

    if (revokeSessions) {
      await this.#devices.endAllSessions(userId);
    }

    try {
      await updateUserEmailHook.run({ userId, email: emailCheck.value });
    } catch {
      console.error(
        `[user-email] divergence: email of ${userId} was updated but updateUserEmailHook failed`,
      );
      return new Failure(UpdateUserEmailError.Unexpected);
    }

    return new OK();
  }
}
