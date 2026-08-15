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

import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { rateLimiter, type RateLimitResult } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { AuthCache } from "../../_core/cache.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { derivedHex } from "../../_core/crypto.ts";
import { goTrue } from "../../_core/gotrue/gotrue_client.ts";
import { AuthMapper } from "../../_core/mappers.ts";
import { AccountRevocation } from "../../_core/revocation.ts";
import { AuthValidator, EmailCheckStatus, PasswordPresenceStatus } from "../../_core/validator.ts";

const _FINGERPRINT_MEMO_MAX = 512;

const _fingerprintMemo = new Map<string, Promise<string>>();

function _memoizedFingerprint(
  memoKey: string,
  derive: () => Promise<string>,
): Promise<string> {
  const known = _fingerprintMemo.get(memoKey);
  if (known) return known;

  if (_fingerprintMemo.size >= _FINGERPRINT_MEMO_MAX) _fingerprintMemo.clear();

  const pending = derive().catch((e) => {
    _fingerprintMemo.delete(memoKey);
    throw e;
  });
  _fingerprintMemo.set(memoKey, pending);
  return pending;
}

export class IntraSignIn {
  private async credentialFingerprint(
    email: string,
    password: string,
  ): Promise<string> {
    const memoKey = await sha256Hex(`${email}:${password}`);
    return _memoizedFingerprint(
      memoKey,
      () => derivedHex("intra-auth", `${email}:${password}`),
    );
  }

  private checkCallerRateLimit(): Promise<RateLimitResult> {
    return rateLimiter.check({
      key: `sign-in:${AccountRole.Admin}:intra`,
      limit: 10,
      window: Time.minutes(5),
      penalty: Time.minutes(5),
      maxPenalty: Time.hours(1),
      failOpen: false,
    });
  }

  private async identityKey(email: string): Promise<string> {
    return `sign-in:${AccountRole.Admin}:intra:to:${await sha256Hex(
      AuthValidator.email.inbox(email),
    )}`;
  }

  private async consumeIdentityFailure(key: string): Promise<void> {
    await rateLimiter.check({
      key,
      limit: 10,
      window: Time.minutes(15),
      penalty: Time.minutes(15),
      maxPenalty: Time.hours(24),
      failOpen: false,
    });
  }

  private async isIdentityLimited(key: string): Promise<boolean> {
    return (await rateLimiter.peek({ key })).limited;
  }

  async withEmailAndPassword(
    email: string,
    password: string,
  ): Promise<string | null> {
    const emailCheck = AuthValidator.email.check(email);
    if (emailCheck.status !== EmailCheckStatus.Ok) return null;
    email = emailCheck.value;

    const presence = AuthValidator.password.presence(password);
    if (presence !== PasswordPresenceStatus.Ok) return null;

    const fingerprint = await this.credentialFingerprint(email, password);
    const cached = await AuthCache.intra.get(fingerprint);
    if (cached !== null) return cached;

    const rate = await this.checkCallerRateLimit();
    if (!rate.ok) return null;

    const identityKey = await this.identityKey(email);
    if (await this.isIdentityLimited(identityKey)) return null;

    const res = await goTrue.signIn.email.withPassword(email, password);
    if (!res.ok) {
      await this.consumeIdentityFailure(identityKey);
      return null;
    }

    const session = AuthMapper.account.session(res.data);
    const role = AuthMapper.account.role(res.data);

    if (session.access_token) {
      void AccountRevocation.session(session.access_token);
    }

    if (role !== AccountRole.Admin || !session.user) {
      await this.consumeIdentityFailure(identityKey);
      return null;
    }

    await AuthCache.intra.remember(fingerprint, session.user.id);
    return session.user.id;
  }
}
