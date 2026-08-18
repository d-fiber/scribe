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
import { UpdateUserPasswordError } from "@scribe/host/dependencies/security/auth/src/user/password.ts";
import { UserClient } from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { MAX_PENDING_TOKEN_CHARS, PendingToken, PendingTokenPurpose } from "../_core/pending_token.ts";
import { AccountRevocation } from "../_core/revocation.ts";

export enum ResetPasswordCompleteError {
  InvalidOrExpiredToken = "invalid_or_expired_token",
  PasswordsDoNotMatch = "passwords_do_not_match",
  InvalidPassword = "invalid_password",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type ResetPasswordCompleteResult = Result<
  void,
  ResetPasswordCompleteError
>;

export class ResetPasswordCompletion {
  readonly #token = new PendingToken(PendingTokenPurpose.PasswordReset);
  readonly #users = new UserClient();
  readonly #expectedRole: AccountRole;

  constructor(expectedRole: AccountRole) {
    this.#expectedRole = expectedRole;
  }

  async complete(
    token: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<ResetPasswordCompleteResult> {
    token = token.trim();

    if (!token || token.length > MAX_PENDING_TOKEN_CHARS) {
      return new Failure(ResetPasswordCompleteError.InvalidOrExpiredToken);
    }

    const payload = await this.#token.payload(token);
    if (!payload || payload.role !== this.#expectedRole) {
      return new Failure(ResetPasswordCompleteError.InvalidOrExpiredToken);
    }

    if (newPassword !== confirmNewPassword) {
      return new Failure(ResetPasswordCompleteError.PasswordsDoNotMatch);
    }

    if (!(await this.#token.exists(token))) {
      return new Failure(ResetPasswordCompleteError.InvalidOrExpiredToken);
    }

    const userId = await this.#accountId(payload.identifier, payload.role);
    if (!userId) {
      return new Failure(ResetPasswordCompleteError.InvalidOrExpiredToken);
    }

    if (!(await this.#token.consume(token))) {
      return new Failure(ResetPasswordCompleteError.InvalidOrExpiredToken);
    }

    const result = await this.#users.password.reset(
      userId,
      newPassword,
      confirmNewPassword,
    );

    if (result instanceof Failure) {
      switch (result.error) {
        case UpdateUserPasswordError.PasswordsDoNotMatch:
          return new Failure(ResetPasswordCompleteError.PasswordsDoNotMatch);
        case UpdateUserPasswordError.InvalidPassword:
          return new Failure(ResetPasswordCompleteError.InvalidPassword);
        case UpdateUserPasswordError.TooManyRequests:
          return new Failure(ResetPasswordCompleteError.TooManyRequests);
        default:
          return new Failure(ResetPasswordCompleteError.Unexpected);
      }
    }

    return new OK();
  }

  async issue(
    userId: string,
    recoverySessionToken: string,
  ): Promise<string | null> {
    await AccountRevocation.session(recoverySessionToken);

    const identifier = await this.#accountIdentifier(
      userId,
      this.#expectedRole,
    );
    if (!identifier) return null;

    return this.#token.issue(identifier, this.#expectedRole, null);
  }

  async #accountIdentifier(
    userId: string,
    role: AccountRole,
  ): Promise<string | null> {
    if (role === AccountRole.Admin) {
      const admin = await database
        .internal_t__admin_users()
        .select((s) => ({ email: s.email }))
        .where((f) => f.admin_id.eq(userId))
        .getOne();
      return admin?.email ?? null;
    }

    const user = await database
      .internal_t__app_users()
      .select((s) => ({ email: s.email, phone: s.phone }))
      .where((f) => f.user_id.eq(userId))
      .getOne();
    return user?.email ?? user?.phone ?? null;
  }

  async #accountId(
    identifier: string,
    role: AccountRole,
  ): Promise<string | null> {
    const isEmail = identifier.includes("@");

    if (role === AccountRole.Admin) {
      const admin = await database
        .internal_t__admin_users()
        .select((s) => ({ admin_id: s.admin_id }))
        .where((f) => isEmail ? f.email.eq(identifier) : f.phone.eq(identifier))
        .getOne();
      return admin?.admin_id ?? null;
    }

    const user = await database
      .internal_t__app_users()
      .select((s) => ({ user_id: s.user_id }))
      .where((f) => (isEmail ? f.email.eq(identifier) : f.phone.eq(identifier)))
      .getOne();
    return user?.user_id ?? null;
  }
}
