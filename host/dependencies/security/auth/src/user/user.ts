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

import { AccountRoleResolver } from "@scribe/host/dependencies/security/auth/src/_core/account.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import { DevicesClient } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { UserEmailClient } from "@scribe/host/dependencies/security/auth/src/user/email.ts";
import { UserIdentitiesClient } from "@scribe/host/dependencies/security/auth/src/user/identities.ts";
import { UserPasswordClient } from "@scribe/host/dependencies/security/auth/src/user/password.ts";
import { UserPhoneClient } from "@scribe/host/dependencies/security/auth/src/user/phone.ts";
import { SignOutScope } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import type { Result } from "@scribe/core/contracts/result.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { RateLimit } from "@scribe/foundation/src/rate_limit/mod.ts";
import { checkCaller } from "@scribe/core/runtime/http/caller.ts";

import { signOutHook, userDeleteHook } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export type { DeletedHook, SignOutHook, SignOutHookPayload } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export { signOutHook, userDeleteHook };

export { UpdateUserEmailError } from "@scribe/host/dependencies/security/auth/src/user/email.ts";
export type { UpdateUserEmailResult } from "@scribe/host/dependencies/security/auth/src/user/email.ts";
export { IdentitiesError, UnlinkIdentityError } from "@scribe/host/dependencies/security/auth/src/user/identities.ts";
export type {
  AccountIdentity,
  IdentitiesResult,
  UnlinkIdentityResult,
} from "@scribe/host/dependencies/security/auth/src/user/identities.ts";
export { UpdateUserPasswordError } from "@scribe/host/dependencies/security/auth/src/user/password.ts";
export type { UpdateUserPasswordResult } from "@scribe/host/dependencies/security/auth/src/user/password.ts";
export { UpdateUserPhoneError } from "@scribe/host/dependencies/security/auth/src/user/phone.ts";
export type { UpdateUserPhoneResult } from "@scribe/host/dependencies/security/auth/src/user/phone.ts";
export {
  updateUserEmailHook,
  updateUserPasswordHook,
  updateUserPhoneHook,
} from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export type {
  UpdateEmailHook,
  UpdateEmailHookPayload,
  UpdatePasswordHook,
  UpdatePasswordHookPayload,
  UpdatePhoneHook,
  UpdatePhoneHookPayload,
} from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";

export enum DeleteUserError {
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type DeleteUserResult = Result<void, DeleteUserError>;

export enum SignOutError {
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type SignOutResult = Result<void, SignOutError>;

const DELETE_LIMIT = new RateLimit({
      key: "user:delete",
      limit: 5,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.hours(1),
      failOpen: false,
});

const DELETE_TARGET_LIMIT = new RateLimit({
      key: "user:delete:of",
      limit: 3,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.minutes(15),
      failOpen: false,
});

const SIGN_OUT_LIMIT = new RateLimit({
      key: "user:sign-out",
      limit: 20,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(2),
      failOpen: true,
});

export class UserClient {
  readonly devices: DevicesClient = new DevicesClient();
  readonly email: UserEmailClient = new UserEmailClient();
  readonly phone: UserPhoneClient = new UserPhoneClient();
  readonly password: UserPasswordClient = new UserPasswordClient();
  readonly identities: UserIdentitiesClient = new UserIdentitiesClient();

  async delete(userId: string): Promise<DeleteUserResult> {
    const rate = await checkCaller(DELETE_LIMIT);
    if (!rate.ok) return new Failure(DeleteUserError.TooManyRequests);

    const targetRate = await DELETE_TARGET_LIMIT.check("", await sha256Hex(userId));
    if (!targetRate.ok) return new Failure(DeleteUserError.TooManyRequests);

    try {
      await userDeleteHook.run(userId);
    } catch {
      return new Failure(DeleteUserError.Unexpected);
    }

    const deleted = await this.#deleteGoTrueUser(userId);

    if (!deleted) {
      console.error(
        `[account-delete] divergence: userDeleteHook succeeded but gotrue deletion failed for ${userId}, the account still exists`,
      );
      return new Failure(DeleteUserError.Unexpected);
    }

    await AccountRevocation.caches(userId);
    return new OK();
  }

  async #deleteGoTrueUser(userId: string): Promise<boolean> {
    const first = await goTrue.user.delete(userId);
    if (first.ok) return true;

    const retry = await goTrue.user.delete(userId);
    return retry.ok;
  }

  async signOut(
    userId: string,
    deviceId: string | null,
    token: string,
  ): Promise<SignOutResult> {
    const rate = await checkCaller(SIGN_OUT_LIMIT);
    if (!rate.ok) return new Failure(SignOutError.TooManyRequests);

    const role = await AccountRoleResolver.withId(userId);
    if (role === null) return new Failure(SignOutError.Unexpected);

    try {
      await signOutHook.run({ userId, deviceId });
    } catch {
      return new Failure(SignOutError.Unexpected);
    }

    await Promise.all([
      goTrue.session.logout(token, SignOutScope.Local),
      this.devices.endSession(userId, deviceId ?? undefined),
      AccountRevocation.caches(userId),
    ]);

    return new OK();
  }
}
