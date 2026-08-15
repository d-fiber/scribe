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

import { OtpChallenge, OtpStartError } from "@scribe/host/dependencies/security/auth/src/sign_in/_otp/otp_challenge.ts";
import type { ResendResult, VerifyOtpOutcome } from "@scribe/host/dependencies/security/auth/src/sign_in/_otp/otp_challenge.ts";
import type { OtpChannel } from "@scribe/host/dependencies/security/auth/src/sign_in/_otp/otp_channel.ts";
import { PendingToken } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import { UserClient } from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import type { AccountRole } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { signInHook, SignInProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import { rateLimiter, type RateLimitResult, RateLimitScope } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { AccountRoleResolver } from "../../_core/account.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { isRateLimitCode } from "../../_core/errors.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import type { AuthError, GoTrueSessionResponse } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/transport.ts";
import { AuthMapper } from "../../_core/mappers.ts";
import { AccountRevocation } from "../../_core/revocation.ts";
import { AuthValidator, EmailCheckStatus, PasswordPresenceStatus } from "../../_core/validator.ts";
import {
  type AuthenticatedSession,
  ConfirmEmailError,
  type ConfirmEmailResult,
  EmailSignInError,
  type EmailSignInResult,
} from "../types.ts";

class EmailOtpChannel implements OtpChannel {
  readonly provider = SignInProvider.Email;

  send(email: string, role: AccountRole): Promise<Result<void, AuthError>> {
    return goTrue.signIn.email.otp.send(email, role);
  }

  verify(
    email: string,
    otp: string,
  ): Promise<Result<GoTrueSessionResponse, AuthError>> {
    return goTrue.signIn.email.otp.verify(email, otp);
  }

  resolveRole(email: string): Promise<AccountRole | null> {
    return AccountRoleResolver.withEmail(email);
  }
}

export class EmailSignIn {
  private readonly users: UserClient;
  private readonly otpChallenge: OtpChallenge;

  constructor(private readonly expectedRole: AccountRole) {
    this.users = new UserClient();
    this.otpChallenge = new OtpChallenge(
      this.users,
      new PendingToken(),
      new EmailOtpChannel(),
      expectedRole,
    );
  }

  private checkCallerRateLimit(): Promise<RateLimitResult> {
    return rateLimiter.check({
      key: `sign-in:${this.expectedRole}:email`,
      limit: 10,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(10),
      failOpen: false,
    });
  }

  private async identityKey(email: string): Promise<string> {
    return `sign-in:${this.expectedRole}:email:to:${await sha256Hex(
      AuthValidator.email.inbox(email),
    )}`;
  }

  private async consumeIdentityFailure(key: string): Promise<void> {
    await Promise.all([
      rateLimiter.check({
        key,
        limit: 10,
        window: Time.minutes(15),
        penalty: Time.minutes(15),
        maxPenalty: Time.hours(24),
        failOpen: false,
      }),
      rateLimiter.check({
        key: `${key}:all`,
        limit: 100,
        window: Time.minutes(15),
        penalty: Time.minutes(5),
        maxPenalty: Time.minutes(5),
        failOpen: false,
        scope: RateLimitScope.Global,
      }),
    ]);
  }

  private async identityLimits(
    key: string,
  ): Promise<{ caller: boolean; global: boolean }> {
    const [caller, global] = await Promise.all([
      rateLimiter.peek({ key }),
      rateLimiter.peek({ key: `${key}:all`, scope: RateLimitScope.Global }),
    ]);
    return { caller: caller.limited, global: global.limited };
  }

  private async checkConfirmRateLimit(): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `sign-in:${this.expectedRole}:confirm`,
      limit: 20,
      window: Time.minutes(1),
      penalty: Time.minutes(5),
      maxPenalty: Time.hours(1),
      failOpen: false,
    });
  }

  private async authenticateGoTrueUser(
    email: string,
    password: string,
    identityKey: string,
  ): Promise<
    | { session: AuthenticatedSession; role: AccountRole }
    | Failure<EmailSignInError>
  > {
    const response = await goTrue.signIn.email.withPassword(email, password);

    if (!response.ok) {
      if (isRateLimitCode(response.error.code)) {
        return new Failure(EmailSignInError.TooManyRequests);
      }

      switch (response.error.code) {
        case "user_not_found":
        case "invalid_credentials":
        case "user_banned":
          await this.consumeIdentityFailure(identityKey);
          return new Failure(EmailSignInError.InvalidCredentials);
        case "email_not_confirmed": {
          const role = (await AccountRoleResolver.withEmail(email)) ??
            this.expectedRole;
          const resendRate = await rateLimiter.check({
            key: `sign-in:${this.expectedRole}:confirm-resend:to:${await sha256Hex(
              AuthValidator.email.inbox(email),
            )}`,
            limit: 1,
            window: Time.seconds(90),
            penalty: Time.seconds(90),
            maxPenalty: Time.seconds(90),
            failOpen: false,
            scope: RateLimitScope.Global,
          });
          if (!resendRate.ok) {
            return new Failure(EmailSignInError.EmailNotConfirmed);
          }

          await goTrue.signIn.email
            .resendConfirmation(email, role)
            .catch(() => {});

          return new Failure(EmailSignInError.EmailNotConfirmed);
        }
        default:
          return new Failure(EmailSignInError.Unexpected);
      }
    }

    const session = AuthMapper.account.session(response.data);
    if (!session.user || !session.access_token) {
      return new Failure(EmailSignInError.Unexpected);
    }

    return {
      session: session as AuthenticatedSession,
      role: AuthMapper.account.role(response.data),
    };
  }

  async withEmailAndPassword(
    email: string,
    password: string,
  ): Promise<EmailSignInResult> {
    const rate = await this.checkCallerRateLimit();
    if (!rate.ok) return new Failure(EmailSignInError.TooManyRequests);

    const emailCheck = AuthValidator.email.check(email);
    switch (emailCheck.status) {
      case EmailCheckStatus.Empty:
        return new Failure(EmailSignInError.EmailRequired);
      case EmailCheckStatus.Invalid:
        return new Failure(EmailSignInError.InvalidCredentials);
    }

    switch (AuthValidator.password.presence(password)) {
      case PasswordPresenceStatus.Empty:
        return new Failure(EmailSignInError.PasswordRequired);
      case PasswordPresenceStatus.TooLong:
        return new Failure(EmailSignInError.InvalidCredentials);
    }

    const identityKey = await this.identityKey(emailCheck.value);
    const identityLimits = await this.identityLimits(identityKey);
    if (identityLimits.caller) {
      return new Failure(EmailSignInError.TooManyRequests);
    }

    const goTrueResult = await this.authenticateGoTrueUser(
      emailCheck.value,
      password,
      identityKey,
    );
    if (goTrueResult instanceof Failure) {
      return identityLimits.global ? new Failure(EmailSignInError.TooManyRequests) : goTrueResult;
    }
    const passwordSession = goTrueResult.session;
    const role = goTrueResult.role;

    let revokePasswordSession = true;

    try {
      if (role !== this.expectedRole) {
        await this.consumeIdentityFailure(identityKey);
        return new Failure(EmailSignInError.InvalidCredentials);
      }

      const device = await requestDevice();
      const isKnownDevice = device
        ? await this.users.devices.isTrust(
          device.device_id,
          passwordSession.user.id,
        )
        : false;

      if (!isKnownDevice) {
        const started = await this.otpChallenge.start(emailCheck.value, role);
        if (!started.ok) {
          return new Failure(
            started.error === OtpStartError.TooManyRequests
              ? EmailSignInError.TooManyRequests
              : EmailSignInError.Unexpected,
          );
        }

        return new OK(started.data);
      }

      try {
        await signInHook.run({
          userId: passwordSession.user.id,
          role,
          provider: SignInProvider.Email,
        });
      } catch {
        return new Failure(EmailSignInError.Unexpected);
      }

      revokePasswordSession = false;
      return new OK(passwordSession);
    } finally {
      if (revokePasswordSession) {
        await AccountRevocation.session(passwordSession.access_token);
      }
    }
  }

  resend(token: string): Promise<ResendResult> {
    return this.otpChallenge.resend(token);
  }

  verifyOtp(token: string, otp: string): Promise<VerifyOtpOutcome> {
    return this.otpChallenge.verifyOtp(token, otp);
  }

  async confirm(
    tokenHash: string,
    type: "signup" | "recovery" | "email_change" | "email",
  ): Promise<ConfirmEmailResult> {
    const rate = await this.checkConfirmRateLimit();
    if (!rate.ok) return new Failure(ConfirmEmailError.Failed);

    const res = await goTrue.signIn.email.verifyToken(tokenHash, type);

    if (!res.ok) {
      const isExpired = res.error.message?.toLowerCase().includes("expired") ||
        res.error.code === "otp_expired";
      return new Failure(
        isExpired ? ConfirmEmailError.Expired : ConfirmEmailError.Failed,
      );
    }

    if (!res.data.access_token) return new OK(null);

    return new OK({
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token as string,
      expires_in: res.data.expires_in as number,
    });
  }
}
