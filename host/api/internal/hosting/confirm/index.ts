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

import { clients } from "@scribe/host/dependencies/clients.ts";
import { AuthMapper, ConfirmEmailError } from "@scribe/host/dependencies/security/auth/src/client.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { serve } from "@scribe/core/kernel/http/serve/mod.ts";
import { rateLimiter } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { ConfirmAccountOutcome, EmailChangeOutcome, ResetOutcome } from "../_contract.ts";
import {
  confirmAccountDeeplink,
  confirmAccountStatus,
  emailChangeStatus,
  notFound,
  resetForm,
  resetStatus,
} from "../_page.ts";

const VALID_TYPES = ["signup", "recovery", "email_change", "email"] as const;
type ConfirmType = (typeof VALID_TYPES)[number];

const RECOVERY_TYPE: ConfirmType = "recovery";
const EMAIL_CHANGE_TYPE: ConfirmType = "email_change";

function failed(outcome: ConfirmAccountOutcome): Response {
  return confirmAccountStatus(outcome);
}

async function recovery(tokenHash: string): Promise<Response> {
  const result = await clients.security.auth.signIn.user.email.confirm(
    tokenHash,
    RECOVERY_TYPE,
  );

  if (!result.ok) return resetStatus(ResetOutcome.InvalidLink);

  const session = result.data;
  const account = session ? await AuthMapper.jwt.account(session.access_token) : null;

  if (!session || !account) return resetStatus(ResetOutcome.InvalidLink);

  const resetToken = await clients.security.auth.resetPassword
    .completionFor(account.role)
    .issue(account.userId, session.access_token);

  if (!resetToken) return resetStatus(ResetOutcome.ResetFailed);

  return resetForm(resetToken);
}

async function emailChange(tokenHash: string): Promise<Response> {
  const result = await clients.security.auth.signIn.user.email.confirm(
    tokenHash,
    EMAIL_CHANGE_TYPE,
  );

  if (!result.ok) {
    return emailChangeStatus(
      result.error === ConfirmEmailError.Expired ? EmailChangeOutcome.InvalidLink : EmailChangeOutcome.ChangeFailed,
    );
  }

  return emailChangeStatus(EmailChangeOutcome.EmailUpdated);
}

serve(async () => {
  if (request.method() !== "GET") return notFound();

  const url = new URL(RequestScope.get().url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as ConfirmType | null;
  const isRecovery = type === RECOVERY_TYPE;
  const isEmailChange = type === EMAIL_CHANGE_TYPE;

  const rate = await rateLimiter.check({
    key: "html:confirm",
    limit: 20,
    window: Time.minutes(1),
    penalty: Time.minutes(5),
    maxPenalty: Time.hours(1),
  });
  if (!rate.ok) {
    if (isRecovery) return resetStatus(ResetOutcome.TooManyAttempts);
    if (isEmailChange) {
      return emailChangeStatus(EmailChangeOutcome.TooManyAttempts);
    }
    return failed(ConfirmAccountOutcome.TooManyAttempts);
  }

  if (!tokenHash || !type || !VALID_TYPES.includes(type)) {
    if (isRecovery) return resetStatus(ResetOutcome.InvalidLink);
    if (isEmailChange) return emailChangeStatus(EmailChangeOutcome.InvalidLink);
    return failed(ConfirmAccountOutcome.InvalidLink);
  }

  if (isRecovery) return recovery(tokenHash);
  if (isEmailChange) return emailChange(tokenHash);

  const result = await clients.security.auth.signIn.user.email.confirm(
    tokenHash,
    type,
  );

  if (!result.ok) {
    return failed(
      result.error === ConfirmEmailError.Expired
        ? ConfirmAccountOutcome.LinkExpired
        : ConfirmAccountOutcome.ConfirmationFailed,
    );
  }

  const session = result.data;
  const account = session ? await AuthMapper.jwt.account(session.access_token) : null;
  const isAdmin = account?.role === AccountRole.Admin;

  if (session && !isAdmin) {
    const params = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: String(session.expires_in),
    });
    return confirmAccountDeeplink(
      `poppin://auth/confirm#${params.toString()}`,
    );
  }

  return confirmAccountStatus(ConfirmAccountOutcome.EmailConfirmed);
});
