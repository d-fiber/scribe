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

import { AuthCache } from "@scribe/host/dependencies/security/auth/src/_core/cache.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { CurrentSessionResolver } from "@scribe/host/dependencies/security/auth/src/_core/current_session.ts";
import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import { AuthMapper } from "@scribe/host/dependencies/security/auth/src/_core/mappers.ts";
import { SessionDeviceClient } from "@scribe/host/dependencies/security/auth/src/session/device.ts";
import {
  DeleteUserError,
  SignOutError as UserSignOutError,
  UpdateUserPasswordError,
  UserClient,
} from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import { type AccountRole, type Session, SignOutScope } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { rateLimiter, type RateLimitResult, RateLimitScope } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";

export { DevicesError, RevokeDeviceError } from "@scribe/host/dependencies/security/auth/src/session/device.ts";
export type { DevicesResult, RevokeDeviceResult } from "@scribe/host/dependencies/security/auth/src/session/device.ts";

export interface SessionResultData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  role: AccountRole;
}

export enum RefreshSessionError {
  Unauthorized = "unauthorized",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type RefreshSessionResult = Result<
  SessionResultData,
  RefreshSessionError
>;

export enum RecoverSessionError {
  Unauthorized = "unauthorized",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type RecoverSessionResult = Result<
  SessionResultData,
  RecoverSessionError
>;

export enum UserDeviceCheckResult {
  Ok = "ok",
  NotFound = "not_found",
  Tampered = "tampered",
  Unexpected = "unexpected",
}

export interface UserDeviceRecord {
  id: string;
  updated_at: unknown;
  hash: string | null;
}

export enum SignOutError {
  Unauthorized = "unauthorized",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type SignOutResult = Result<void, SignOutError>;

export enum UpdatePasswordError {
  Unauthorized = "unauthorized",
  PasswordsDoNotMatch = "passwords_do_not_match",
  SameAsCurrentPassword = "same_as_current_password",
  InvalidPassword = "invalid_password",
  InvalidCurrentPassword = "invalid_current_password",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type UpdatePasswordResult = Result<void, UpdatePasswordError>;

export enum DeleteAccountError {
  Unauthorized = "unauthorized",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type DeleteAccountResult = Result<void, DeleteAccountError>;

type RecoveredSession = Session & {
  access_token: string;
  user: NonNullable<Session["user"]>;
};

export class SessionClient {
  readonly device: SessionDeviceClient = new SessionDeviceClient();
  readonly #users = new UserClient();

  private async checkRefreshRateLimit(
    refreshToken: string,
  ): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:refresh-session:${await sha256Hex(refreshToken)}`,
      limit: 20,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(2),
      failOpen: true,
    });
  }

  private async checkRecoverRateLimit(
    refreshToken: string,
  ): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:recover-session:${await sha256Hex(refreshToken)}`,
      limit: 20,
      window: Time.minutes(1),
      penalty: Time.minutes(1),
      maxPenalty: Time.minutes(2),
      failOpen: true,
    });
  }

  private async checkDeleteRateLimit(userId: string): Promise<RateLimitResult> {
    return await rateLimiter.check({
      key: `user:delete-account:of:${await sha256Hex(userId)}`,
      limit: 3,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.minutes(15),
      failOpen: false,
      scope: RateLimitScope.Global,
    });
  }

  async refresh(refreshToken: string): Promise<RefreshSessionResult> {
    const rate = await this.checkRefreshRateLimit(refreshToken);
    if (!rate.ok) return new Failure(RefreshSessionError.TooManyRequests);

    const cacheKey = await sha256Hex(refreshToken);
    const cached = await AuthCache.session.refreshed<SessionResultData>(
      cacheKey,
    );
    if (cached) return new OK(cached);

    const res = await goTrue.session.refreshToken(refreshToken);
    if (!res.ok) return new Failure(RefreshSessionError.Unauthorized);

    const session = AuthMapper.account.session(res.data);
    const accessToken = session.access_token;
    const user = session.user;
    if (!user || !accessToken) {
      return new Failure(RefreshSessionError.Unauthorized);
    }

    const result = this.#sessionResult(
      { ...session, access_token: accessToken, user },
      AuthMapper.account.role(res.data),
    );

    await Promise.all([
      AuthCache.session.rememberRefreshed(user.id, cacheKey, result),
      this.device.refresh(),
    ]);
    return new OK(result);
  }

  async recover(
    accessToken: string,
    refreshToken: string,
  ): Promise<RecoverSessionResult> {
    if (!accessToken.trim() || !refreshToken.trim()) {
      return new Failure(RecoverSessionError.Unauthorized);
    }

    const rate = await this.checkRecoverRateLimit(refreshToken);
    if (!rate.ok) return new Failure(RecoverSessionError.TooManyRequests);

    const cacheKey = await sha256Hex(`${accessToken}.${refreshToken}`);
    const cached = await AuthCache.session.recovered<SessionResultData>(
      cacheKey,
    );
    if (cached) return new OK(cached);

    const recovered = await this.#recoverSession(accessToken, refreshToken);
    if (!recovered) return new Failure(RecoverSessionError.Unauthorized);

    const result = this.#sessionResult(recovered.session, recovered.role);

    await Promise.all([
      AuthCache.session.rememberRecovered(
        recovered.session.user.id,
        cacheKey,
        result,
      ),
      this.device.refresh(),
    ]);
    return new OK(result);
  }

  async #recoverSession(
    accessToken: string,
    refreshToken: string,
  ): Promise<{ session: RecoveredSession; role: AccountRole } | null> {
    const userRes = await goTrue.session.user(accessToken);

    if (userRes.ok) {
      const user = AuthMapper.account.user(userRes.data);
      if (user) {
        return {
          session: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: AuthMapper.jwt.expiresInUnverified(accessToken),
            token_type: "bearer",
            user,
          },
          role: AuthMapper.account.role(userRes.data),
        };
      }
    }

    const res = await goTrue.session.refreshToken(refreshToken);
    if (!res.ok) return null;

    const session = AuthMapper.account.session(res.data);
    const accessTokenValue = session.access_token;
    const user = session.user;
    if (!user || !accessTokenValue) return null;

    return {
      session: { ...session, access_token: accessTokenValue, user },
      role: AuthMapper.account.role(res.data),
    };
  }

  #sessionResult(
    session: RecoveredSession,
    role: AccountRole,
  ): SessionResultData {
    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      token_type: session.token_type,
      role,
    };
  }

  async signOut(): Promise<SignOutResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(SignOutError.Unauthorized);

    const deviceId = await CurrentSessionResolver.deviceId();

    const result = await this.#users.signOut(
      session.userId,
      deviceId,
      session.token,
    );
    if (result instanceof Failure) {
      switch (result.error) {
        case UserSignOutError.TooManyRequests:
          return new Failure(SignOutError.TooManyRequests);
        default:
          return new Failure(SignOutError.Unexpected);
      }
    }

    return new OK();
  }

  async password(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<UpdatePasswordResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(UpdatePasswordError.Unauthorized);

    const result = await this.#users.password.update(
      session.userId,
      currentPassword,
      newPassword,
      confirmNewPassword,
    );

    if (result instanceof Failure) {
      switch (result.error) {
        case UpdateUserPasswordError.PasswordsDoNotMatch:
          return new Failure(UpdatePasswordError.PasswordsDoNotMatch);
        case UpdateUserPasswordError.SameAsCurrentPassword:
          return new Failure(UpdatePasswordError.SameAsCurrentPassword);
        case UpdateUserPasswordError.InvalidPassword:
          return new Failure(UpdatePasswordError.InvalidPassword);
        case UpdateUserPasswordError.InvalidCurrentPassword:
          return new Failure(UpdatePasswordError.InvalidCurrentPassword);
        case UpdateUserPasswordError.TooManyRequests:
          return new Failure(UpdatePasswordError.TooManyRequests);
        default:
          return new Failure(UpdatePasswordError.Unexpected);
      }
    }

    return new OK();
  }

  async delete(): Promise<DeleteAccountResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(DeleteAccountError.Unauthorized);

    const { userId, token } = session;

    const rate = await this.checkDeleteRateLimit(userId);
    if (!rate.ok) return new Failure(DeleteAccountError.TooManyRequests);

    await Promise.all([
      this.#users.devices.endAllSessions(userId),
      goTrue.session.logout(token, SignOutScope.Global),
    ]);

    const result = await this.#users.delete(userId);
    if (result instanceof Failure) {
      switch (result.error) {
        case DeleteUserError.TooManyRequests:
          return new Failure(DeleteAccountError.TooManyRequests);
        default:
          return new Failure(DeleteAccountError.Unexpected);
      }
    }

    return new OK();
  }
}
