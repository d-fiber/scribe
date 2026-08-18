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

import { database } from "@scribe/foundation/src/database/database.ts";
import { AccountRoleResolver } from "@scribe/host/dependencies/security/auth/src/_core/account.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import { AuthValidator } from "@scribe/host/dependencies/security/auth/src/_core/validator.ts";
import { DevicesClient } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import type { Result } from "@scribe/core/contracts/result.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { rateLimiter, type RateLimitResult, RateLimitScope } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";

import { updateUserPasswordHook } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export type { UpdatePasswordHook, UpdatePasswordHookPayload } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export { updateUserPasswordHook };

export enum UpdateUserPasswordError {
  PasswordsDoNotMatch = "passwords_do_not_match",
  SameAsCurrentPassword = "same_as_current_password",
  InvalidPassword = "invalid_password",
  InvalidCurrentPassword = "invalid_current_password",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type UpdateUserPasswordResult = Result<void, UpdateUserPasswordError>;

interface UserIdentity {
  email: string | null;
  phone: string | null;
}

export class UserPasswordClient {
  readonly #devices = new DevicesClient();

  private checkCallerRateLimit(): Promise<RateLimitResult> {
    return rateLimiter.check({
      key: `user:password`,
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(30),
      failOpen: false,
    });
  }

  private async checkTargetRateLimit(userId: string): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:password:of:${await sha256Hex(userId)}`,
      limit: 5,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.minutes(15),
      failOpen: false,
      scope: RateLimitScope.Global,
    });
  }

  async update(
    userId: string,
    current: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<UpdateUserPasswordResult> {
    const rate = await this.checkCallerRateLimit();
    if (!rate.ok) return new Failure(UpdateUserPasswordError.TooManyRequests);

    const targetRate = await this.checkTargetRateLimit(userId);
    if (!targetRate.ok) {
      return new Failure(UpdateUserPasswordError.TooManyRequests);
    }

    if (newPassword !== confirmNewPassword) {
      return new Failure(UpdateUserPasswordError.PasswordsDoNotMatch);
    }
    if (current === newPassword) {
      return new Failure(UpdateUserPasswordError.SameAsCurrentPassword);
    }
    if (!AuthValidator.password.isValid(newPassword)) {
      return new Failure(UpdateUserPasswordError.InvalidPassword);
    }

    const identity = await this.#identityOf(userId);
    if (!identity) return new Failure(UpdateUserPasswordError.Unexpected);

    const signInRes = identity.email
      ? await goTrue.signIn.email.withPassword(identity.email, current)
      : identity.phone
      ? await goTrue.signIn.phone.withPassword(identity.phone, current)
      : null;

    if (!signInRes || !signInRes.ok) {
      return new Failure(UpdateUserPasswordError.InvalidCurrentPassword);
    }

    let revoked = false;

    try {
      const passwordUpdated = await goTrue.user.password.update(
        userId,
        newPassword,
      );
      if (!passwordUpdated.ok) {
        return new Failure(UpdateUserPasswordError.Unexpected);
      }

      revoked = true;
      await AccountRevocation.sessions(
        userId,
        signInRes.data.access_token ?? null,
      );
      await this.#devices.endAllSessions(userId);

      try {
        await updateUserPasswordHook.run({ userId });
      } catch {
        console.error(
          `[user-password] divergence: password of ${userId} was updated and sessions revoked, but updateUserPasswordHook failed`,
        );
        return new Failure(UpdateUserPasswordError.Unexpected);
      }

      return new OK();
    } finally {
      if (!revoked && signInRes.data.access_token) {
        await AccountRevocation.session(signInRes.data.access_token);
      }
    }
  }

  async reset(
    userId: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<UpdateUserPasswordResult> {
    const rate = await this.checkCallerRateLimit();
    if (!rate.ok) return new Failure(UpdateUserPasswordError.TooManyRequests);

    const targetRate = await this.checkTargetRateLimit(userId);
    if (!targetRate.ok) {
      return new Failure(UpdateUserPasswordError.TooManyRequests);
    }

    if (newPassword !== confirmNewPassword) {
      return new Failure(UpdateUserPasswordError.PasswordsDoNotMatch);
    }
    if (!AuthValidator.password.isValid(newPassword)) {
      return new Failure(UpdateUserPasswordError.InvalidPassword);
    }

    const passwordUpdated = await goTrue.user.password.update(
      userId,
      newPassword,
    );
    if (!passwordUpdated.ok) {
      return new Failure(UpdateUserPasswordError.Unexpected);
    }

    await AccountRevocation.sessions(userId, null);
    await this.#devices.endAllSessions(userId);

    try {
      await updateUserPasswordHook.run({ userId });
    } catch {
      console.error(
        `[user-password] divergence: password of ${userId} was reset and sessions revoked, but updateUserPasswordHook failed`,
      );
      return new Failure(UpdateUserPasswordError.Unexpected);
    }

    return new OK();
  }

  async #identityOf(userId: string): Promise<UserIdentity | null> {
    const role = await AccountRoleResolver.withId(userId);
    if (role === AccountRole.User) return this.#userIdentity(userId);
    if (role === AccountRole.Admin) return this.#adminIdentity(userId);
    return null;
  }

  async #userIdentity(userId: string): Promise<UserIdentity | null> {
    const row = await database
      .internal_t__app_users()
      .select((s) => ({ email: s.email, phone: s.phone }))
      .where((f) => f.user_id.eq(userId))
      .getOne();
    return row ? { email: row.email, phone: row.phone } : null;
  }

  async #adminIdentity(userId: string): Promise<UserIdentity | null> {
    const row = await database
      .internal_t__admin_users()
      .unscoped()
      .select((s) => ({ email: s.email }))
      .where((f) => f.admin_id.eq(userId))
      .getOne();
    return row ? { email: row.email, phone: null } : null;
  }
}
