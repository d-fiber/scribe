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
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import type { SignUpHookResult } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import { signUpHook, SignUpProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import { RateLimit } from "@scribe/foundation/src/rate_limit/mod.ts";
import { checkCaller } from "@scribe/core/runtime/http/caller.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { isRateLimitCode } from "../../_core/errors.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import { AuthValidator, PasswordCheckStatus, PhoneCheckStatus } from "../../_core/validator.ts";
import { DevicesClient } from "../../user/devices/devices.ts";
import { type SignUpAccount, SignUpChannel } from "../account/account.ts";
import { type PhoneSignUpBase, PhoneSignUpError, type SignUpResult } from "../types.ts";

const userDevices = new DevicesClient();

export class PhoneSignUp<TInput extends PhoneSignUpBase, TPrepared> {
  readonly #caller: RateLimit;
  readonly #recipient: RateLimit;

  constructor(private readonly account: SignUpAccount<TInput, TPrepared>) {
    this.#caller = new RateLimit({
      key: `sign-up:${account.role}`,
      limit: 5,
      window: Time.minutes(30),
      penalty: Time.hours(1),
      maxPenalty: Time.hours(24),
      failOpen: false,
    });
    this.#recipient = new RateLimit({
      key: `sign-up:${account.role}:phone:to`,
      limit: 3,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.minutes(15),
      failOpen: false,
    });
  }

  private async createGoTrueUser(
    phone: string,
    password: string,
  ): Promise<{ userId: string } | Failure<PhoneSignUpError>> {
    const response = await goTrue.signUp.createUserWithPhone(phone, password);

    if (!response.ok) {
      if (isRateLimitCode(response.error.code)) {
        return new Failure(PhoneSignUpError.TooManyRequests);
      }

      switch (response.error.code) {
        case "user_already_exists":
        case "phone_exists":
          return new Failure(PhoneSignUpError.PhoneAlreadyExists);
        case "weak_password":
          return new Failure(PhoneSignUpError.InvalidPassword);
        case "sms_send_failed":
          return new Failure(PhoneSignUpError.Unexpected);
        default:
          return new Failure(PhoneSignUpError.Unexpected);
      }
    }

    const userId = response.data.user?.id;
    if (!userId) return new Failure(PhoneSignUpError.Unexpected);
    return { userId };
  }

  async withPhoneAndPassword(
    data: TInput,
  ): Promise<SignUpResult<PhoneSignUpError>> {
    const rate = await checkCaller(this.#caller);
    if (!rate.ok) return new Failure(PhoneSignUpError.TooManyRequests);

    let phone = data.phone;
    const password = data.password;

    if (AuthValidator.phone.check(phone).status === PhoneCheckStatus.Empty) {
      return new Failure(PhoneSignUpError.PhoneRequired);
    }
    if (AuthValidator.phone.check(phone).status === PhoneCheckStatus.Invalid) {
      return new Failure(PhoneSignUpError.InvalidPhone);
    }
    if (
      AuthValidator.password.check(password).status ===
        PasswordCheckStatus.Empty
    ) {
      return new Failure(PhoneSignUpError.PasswordRequired);
    }
    if (
      AuthValidator.password.check(password).status ===
        PasswordCheckStatus.Invalid
    ) {
      return new Failure(PhoneSignUpError.InvalidPassword);
    }

    const prepared = await this.account.prepare(data);
    if (prepared instanceof Failure) return prepared;

    phone = AuthValidator.phone.format(phone);
    const recipientRate = await this.#recipient.check("", await sha256Hex(phone));
    if (!recipientRate.ok) return new Failure(PhoneSignUpError.TooManyRequests);

    const device = await requestDevice();
    if (!device) return new Failure(PhoneSignUpError.Unexpected);

    const goTrueResult = await this.createGoTrueUser(phone, password);
    if (goTrueResult instanceof Failure) return goTrueResult;
    const userId = goTrueResult.userId;

    const roleSet = await goTrue.user.role.update(userId, this.account.role);
    if (!roleSet.ok) {
      if (roleSet.error.code === "user_not_found") {
        return new Failure(PhoneSignUpError.PhoneAlreadyExists);
      }
      await goTrue.user.delete(userId);
      return new Failure(PhoneSignUpError.Unexpected);
    }

    const inserted = await this.account.insert({
      userId,
      identity: {
        channel: SignUpChannel.Phone,
        phone: phone,
      },
      data,
      prepared,
      device,
    });
    if (!inserted) {
      await goTrue.user.delete(userId);
      return new Failure(PhoneSignUpError.Unexpected);
    }

    const token = await userDevices.insert(userId);
    if (!token) {
      await goTrue.user.delete(userId);
      return new Failure(PhoneSignUpError.Unexpected);
    }

    let hookResult: SignUpHookResult;
    try {
      hookResult = await signUpHook.run({
        userId,
        role: this.account.role,
        provider: SignUpProvider.Phone,
        data: data.data,
      });
    } catch {
      hookResult = new Failure({
        code: PhoneSignUpError.Unexpected,
        message: "Sign-up failed unexpectedly.",
      });
    }

    if (!hookResult.ok) {
      await goTrue.user.delete(userId);
      return new Failure(hookResult.error);
    }

    return new OK({ device_token: token });
  }
}
