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
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { RateLimit } from "@scribe/foundation/src/rate_limit/mod.ts";
import { checkCaller } from "@scribe/core/runtime/http/caller.ts";
import { signInHook, SignInProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import { DevicesClient } from "../../user/devices/devices.ts";
import { isRateLimitCode } from "../../_core/errors.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import { AccountRevocation } from "../../_core/revocation.ts";
import { SocialProvider } from "../../_core/gotrue/primitives.ts";
import { AuthMapper } from "../../_core/mappers.ts";
import { type AuthenticatedSession, SocialSignInError, type SocialSignInResult } from "../types.ts";

export class SocialSignIn {
  private readonly devices = new DevicesClient();

  readonly #caller: RateLimit;

  constructor(
    private readonly provider: SocialProvider,
    private readonly expectedRole: AccountRole,
  ) {
    this.#caller = new RateLimit({
      key: `sign-in:${expectedRole}:social`,
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(10),
      failOpen: false,
    });
  }

  private async authenticateGoTrueUser(
    idToken: string,
    nonce: string,
    accessToken?: string,
  ): Promise<
    | { session: AuthenticatedSession; role: AccountRole }
    | Failure<SocialSignInError>
  > {
    const response = this.provider === SocialProvider.Google
      ? await goTrue.signIn.social.google.signIn(idToken, nonce, accessToken)
      : await goTrue.signIn.social.apple.signIn(idToken, nonce, accessToken);

    if (!response.ok) {
      if (isRateLimitCode(response.error.code)) {
        return new Failure(SocialSignInError.TooManyRequests);
      }
      return new Failure(SocialSignInError.SignInFailed);
    }

    const session = AuthMapper.account.session(response.data);
    if (!session.user || !session.access_token) {
      return new Failure(SocialSignInError.Unexpected);
    }

    return {
      session: session as AuthenticatedSession,
      role: AuthMapper.account.role(response.data),
    };
  }

  async withIdToken(
    idToken: string,
    nonce: string,
    accessToken?: string,
  ): Promise<SocialSignInResult> {
    const rate = await checkCaller(this.#caller);
    if (!rate.ok) return new Failure(SocialSignInError.TooManyRequests);

    if (idToken.trim().length === 0 || nonce.trim().length === 0) {
      return new Failure(SocialSignInError.Unexpected);
    }

    const goTrueResult = await this.authenticateGoTrueUser(
      idToken,
      nonce,
      accessToken,
    );
    if (goTrueResult instanceof Failure) return goTrueResult;
    const session = goTrueResult.session;
    const role = goTrueResult.role;

    let revokeSession = true;

    try {
      if (role !== this.expectedRole) {
        return new Failure(SocialSignInError.SignInFailed);
      }

      const deviceToken = await this.devices.insert(session.user.id);
      if (!deviceToken) return new Failure(SocialSignInError.Unexpected);

      try {
        await signInHook.run({
          userId: session.user.id,
          role,
          provider: SignInProvider.Social,
        });
      } catch {
        return new Failure(SocialSignInError.Unexpected);
      }

      revokeSession = false;
      return new OK({ ...session, device_token: deviceToken });
    } finally {
      if (revokeSession) {
        await AccountRevocation.session(session.access_token);
      }
    }
  }
}
