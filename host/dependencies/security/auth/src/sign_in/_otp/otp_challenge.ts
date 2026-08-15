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

import type { UserClient } from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import { type AccountRole, SignOutScope } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { kv } from "@scribe/core/runtime/redis/mod.ts";
import { signInHook } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import {
  type OtpRateLimitResult,
  rateLimiter,
  type RateLimitResult,
  RateLimitScope,
} from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { isRateLimitCode } from "../../_core/errors.ts";
import { AuthMapper } from "../../_core/mappers.ts";
import { AccountRevocation } from "../../_core/revocation.ts";
import type { OtpChannel } from "./otp_channel.ts";
import { MAX_PENDING_TOKEN_CHARS, type PendingToken } from "../../_core/pending_token.ts";

export enum OtpStartError {
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type OtpChallengeStartResult = Result<
  { pendingToken: string },
  OtpStartError
>;

export enum VerifyOtpError {
  InvalidOrExpired = "invalid_or_expired",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type VerifyOtpResult = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user_id: string;
  device_token: string;
  app_metadata: { role: AccountRole | null };
};

export type VerifyOtpOutcome = Result<VerifyOtpResult, VerifyOtpError>;

export enum ResendError {
  InvalidOrExpiredToken = "invalid_or_expired_token",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type ResendResult = Result<{ pendingToken: string }, ResendError>;

const _GLOBAL_OTP_ATTEMPTS = 5;

const _UNCOUNTABLE_RETRY_AFTER_S = Time.minutes(1).value;

type OtpAttemptTally =
  | { readonly counted: true; readonly attempts: number }
  | { readonly counted: false };

async function _globalOtpAttempts(
  prefix: string,
  fingerprint: string,
): Promise<OtpAttemptTally> {
  const key = `rl:${prefix}:global:${fingerprint}`;
  try {
    const attempts = await kv().incr(key);
    if (attempts === 1) await kv().expire(key, Time.minutes(10).value);
    return { counted: true, attempts };
  } catch (e) {
    console.error(`[otp-challenge:${prefix}] attempt counter unavailable:`, e);
    return { counted: false };
  }
}

async function _globalOtpBudget(
  prefix: string,
  fingerprint: string,
): Promise<OtpRateLimitResult | null> {
  const tally = await _globalOtpAttempts(prefix, fingerprint);

  if (!tally.counted) {
    return {
      ok: false,
      consume: false,
      retryAfter: _UNCOUNTABLE_RETRY_AFTER_S,
    };
  }

  if (tally.attempts > _GLOBAL_OTP_ATTEMPTS) {
    return { ok: false, consume: true, retryAfter: 0 };
  }

  return null;
}

const _identityOtpLimit = (
  prefix: string,
  role: AccountRole,
  recipient: string,
): Promise<RateLimitResult> =>
  rateLimiter.check({
    key: `sign-in:${role}:${prefix}:to:${recipient}`,
    limit: 10,
    window: Time.minutes(15),
    penalty: Time.minutes(15),
    maxPenalty: Time.minutes(15),
    failOpen: false,
    scope: RateLimitScope.Global,
  });

const RateLimit = {
  verifyOtp: async (
    fingerprint: string,
    role: AccountRole,
    recipient: string,
  ): Promise<OtpRateLimitResult> => {
    const budget = await _globalOtpBudget("verify-otp", fingerprint);
    if (budget) return budget;

    const identity = await _identityOtpLimit("verify-otp", role, recipient);
    if (!identity.ok) {
      return { ok: false, consume: false, retryAfter: identity.retryAfter };
    }
    return { ok: true };
  },
  resend: async (
    fingerprint: string,
    role: AccountRole,
    recipient: string,
  ): Promise<OtpRateLimitResult> => {
    const budget = await _globalOtpBudget("resend-otp", fingerprint);
    if (budget) return budget;

    const identity = await _identityOtpLimit("resend-otp", role, recipient);
    if (!identity.ok) {
      return { ok: false, consume: false, retryAfter: identity.retryAfter };
    }

    const rate = await rateLimiter.check({
      key: `sign-in:${role}:resend-otp:cadence:${recipient}`,
      limit: 1,
      window: Time.seconds(90),
      penalty: Time.seconds(90),
      maxPenalty: Time.seconds(90),
      failOpen: false,
      scope: RateLimitScope.Global,
    });

    if (!rate.ok) {
      return { ok: false, consume: false, retryAfter: rate.retryAfter };
    }
    return { ok: true };
  },
};

export class OtpChallenge {
  readonly #token: PendingToken;
  readonly #users: UserClient;
  readonly #channel: OtpChannel;
  readonly #expectedRole: AccountRole;

  constructor(
    users: UserClient,
    token: PendingToken,
    channel: OtpChannel,
    expectedRole: AccountRole,
  ) {
    this.#users = users;
    this.#token = token;
    this.#channel = channel;
    this.#expectedRole = expectedRole;
  }

  async start(
    identifier: string,
    role: AccountRole,
  ): Promise<OtpChallengeStartResult> {
    if (role !== this.#expectedRole) {
      return new Failure(OtpStartError.Unexpected);
    }

    const otpRes = await this.#channel.send(identifier, role);

    if (!otpRes.ok) {
      return new Failure(
        isRateLimitCode(otpRes.error.code) ? OtpStartError.TooManyRequests : OtpStartError.Unexpected,
      );
    }

    const device = await requestDevice();
    const pendingToken = await this.#token.issue(
      identifier,
      role,
      device?.device_id ?? null,
    );
    if (!pendingToken) return new Failure(OtpStartError.Unexpected);

    return new OK({ pendingToken });
  }

  async resend(token: string): Promise<ResendResult> {
    token = token.trim();

    if (!token || token.length > MAX_PENDING_TOKEN_CHARS) {
      return new Failure(ResendError.InvalidOrExpiredToken);
    }

    const payload = await this.#token.payload(token);
    if (!payload || payload.role !== this.#expectedRole) {
      return new Failure(ResendError.InvalidOrExpiredToken);
    }

    const device = await requestDevice();
    if ((device?.device_id ?? null) !== payload.deviceId) {
      return new Failure(ResendError.InvalidOrExpiredToken);
    }

    const identifier = payload.identifier;
    const [fingerprint, recipient] = await Promise.all([
      sha256Hex(token),
      sha256Hex(identifier),
    ]);

    const rate = await RateLimit.resend(fingerprint, payload.role, recipient);
    if (!rate.ok) {
      if (rate.consume) {
        await this.#token.consume(token);
        return new Failure(ResendError.InvalidOrExpiredToken);
      }
      return new Failure(ResendError.TooManyRequests);
    }

    if (!(await this.#token.exists(token))) {
      return new Failure(ResendError.InvalidOrExpiredToken);
    }

    const role = await this.#channel.resolveRole(identifier);

    if (role === null || role !== this.#expectedRole) {
      return new Failure(ResendError.InvalidOrExpiredToken);
    }

    const res = await this.#channel.send(identifier, role);

    if (!res.ok) {
      return new Failure(
        isRateLimitCode(res.error.code) ? ResendError.TooManyRequests : ResendError.Unexpected,
      );
    }

    const pendingToken = await this.#token.issue(
      identifier,
      role,
      payload.deviceId,
    );
    if (!pendingToken) return new Failure(ResendError.Unexpected);

    await this.#token.consume(token);

    return new OK({ pendingToken });
  }

  async verifyOtp(token: string, otp: string): Promise<VerifyOtpOutcome> {
    token = token.trim();

    if (!token || token.length > MAX_PENDING_TOKEN_CHARS) {
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }
    if (!/^[0-9]{6}$/.test(otp)) {
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }

    const payload = await this.#token.payload(token);
    if (!payload || payload.role !== this.#expectedRole) {
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }

    const device = await requestDevice();
    if ((device?.device_id ?? null) !== payload.deviceId) {
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }

    const fingerprint = await sha256Hex(token);
    const rate = await RateLimit.verifyOtp(
      fingerprint,
      payload.role,
      await sha256Hex(payload.identifier),
    );
    if (!rate.ok) {
      if (rate.consume) {
        await this.#token.consume(token);
        return new Failure(VerifyOtpError.InvalidOrExpired);
      }
      return new Failure(VerifyOtpError.TooManyRequests);
    }

    const identifier = payload.identifier;
    if (!(await this.#token.exists(token))) {
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }

    const res = await this.#channel.verify(identifier, otp);

    if (!res.ok) {
      if (isRateLimitCode(res.error.code)) {
        return new Failure(VerifyOtpError.TooManyRequests);
      }

      switch (res.error.code) {
        case "otp_expired":
          return new Failure(VerifyOtpError.InvalidOrExpired);
        case "otp_disabled":
          return new Failure(VerifyOtpError.Unexpected);
        default:
          return new Failure(VerifyOtpError.InvalidOrExpired);
      }
    }

    const session = AuthMapper.account.session(res.data);

    if (!session.user || !session.access_token) {
      return new Failure(VerifyOtpError.Unexpected);
    }
    const accessToken = session.access_token;

    const role = AuthMapper.account.role(res.data);

    if (role !== this.#expectedRole) {
      await AccountRevocation.session(accessToken, SignOutScope.Global);
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }

    const [consumed, deviceToken] = await Promise.all([
      this.#token.consume(token),
      this.#users.devices.insert(session.user.id),
    ]);

    if (!consumed) {
      await AccountRevocation.session(accessToken);
      return new Failure(VerifyOtpError.InvalidOrExpired);
    }

    if (!deviceToken) {
      await AccountRevocation.session(accessToken);
      return new Failure(VerifyOtpError.Unexpected);
    }

    try {
      await signInHook.run({
        userId: session.user.id,
        role,
        provider: this.#channel.provider,
      });
    } catch {
      await AccountRevocation.session(accessToken);
      return new Failure(VerifyOtpError.Unexpected);
    }

    return new OK({
      access_token: accessToken,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: session.token_type,
      user_id: session.user.id,
      device_token: deviceToken,
      app_metadata: { role },
    });
  }
}
