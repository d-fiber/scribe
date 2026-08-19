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
import { isRateLimitCode } from "../../_core/errors.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import { SocialProvider } from "../../_core/gotrue/primitives.ts";
import { DevicesClient } from "../../user/devices/devices.ts";
import { type SignUpAccount, SignUpChannel } from "../account/account.ts";
import { type SignUpResult, type SocialSignUpBase, SocialSignUpError } from "../types.ts";

const userDevices = new DevicesClient();

const CALLER_LIMIT = new RateLimit({
      key: "sign-up",
      limit: 5,
      window: Time.minutes(30),
      penalty: Time.hours(1),
      maxPenalty: Time.hours(24),
      failOpen: false,
});

export class SocialSignUp<TInput extends SocialSignUpBase, TPrepared> {
  constructor(
    private readonly provider: SocialProvider,
    private readonly account: SignUpAccount<TInput, TPrepared>,
  ) {}

  private async createGoTrueUser(
    idToken: string,
    nonce: string,
    accessToken?: string,
  ): Promise<
    { userId: string; email: string | null } | Failure<SocialSignUpError>
  > {
    const response = this.provider === SocialProvider.Google
      ? await goTrue.signUp.createUserWithGoogle(idToken, nonce, accessToken)
      : await goTrue.signUp.createUserWithApple(idToken, nonce, accessToken);

    if (!response.ok) {
      if (isRateLimitCode(response.error.code)) {
        return new Failure(SocialSignUpError.TooManyRequests);
      }
      return new Failure(SocialSignUpError.Unexpected);
    }

    const userId = response.data.user?.id;
    if (!userId) return new Failure(SocialSignUpError.Unexpected);
    return { userId, email: response.data.user?.email || null };
  }

  async withIdToken(data: TInput): Promise<SignUpResult<SocialSignUpError>> {
    const rate = await checkCaller(CALLER_LIMIT, this.account.role);
    if (!rate.ok) return new Failure(SocialSignUpError.TooManyRequests);

    const idToken = data.idToken;
    const nonce = data.nonce;

    if (idToken.trim().length === 0 || nonce.trim().length === 0) {
      return new Failure(SocialSignUpError.Unexpected);
    }

    const prepared = await this.account.prepare(data);
    if (prepared instanceof Failure) return prepared;

    const device = await requestDevice();
    if (!device) return new Failure(SocialSignUpError.Unexpected);

    const goTrueResult = await this.createGoTrueUser(
      idToken,
      nonce,
      data.accessToken,
    );
    if (goTrueResult instanceof Failure) return goTrueResult;
    const userId = goTrueResult.userId;
    const email = goTrueResult.email;

    if (await this.account.exists(userId)) {
      return new Failure(SocialSignUpError.AccountAlreadyExists);
    }

    const roleSet = await goTrue.user.role.update(userId, this.account.role);
    if (!roleSet.ok) {
      await goTrue.user.delete(userId);
      return new Failure(SocialSignUpError.Unexpected);
    }

    const inserted = await this.account.insert({
      userId,
      identity: {
        channel: SignUpChannel.Social,
        provider: this.provider,
        email: email,
      },
      data,
      prepared,
      device,
    });
    if (!inserted) {
      await goTrue.user.delete(userId);
      return new Failure(SocialSignUpError.Unexpected);
    }

    const token = await userDevices.insert(userId);
    if (!token) {
      await goTrue.user.delete(userId);
      return new Failure(SocialSignUpError.Unexpected);
    }

    let hookResult: SignUpHookResult;
    try {
      hookResult = await signUpHook.run({
        userId,
        role: this.account.role,
        provider: SignUpProvider.Social,
        data: data.data,
      });
    } catch {
      hookResult = new Failure({
        code: SocialSignUpError.Unexpected,
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
