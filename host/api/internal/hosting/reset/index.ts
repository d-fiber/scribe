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
import { ResetPasswordCompleteError } from "@scribe/host/dependencies/security/auth/src/reset_password/reset_password.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { serve } from "@scribe/core/kernel/http/serve/mod.ts";
import { rateLimiter } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { HOSTING_FORM_FIELDS, ResetFormError, ResetOutcome } from "../_contract.ts";
import { resetForm, resetStatus } from "../_page.ts";

function submittedForm(): URLSearchParams {
  const bytes = request.bytes();
  return new URLSearchParams(bytes ? new TextDecoder().decode(bytes) : "");
}

serve(async () => {
  if (request.method() !== "POST") {
    return resetStatus(ResetOutcome.InvalidLink);
  }

  const rate = await rateLimiter.check({
    key: "html:reset:set-password",
    limit: 10,
    window: Time.minutes(15),
    penalty: Time.minutes(15),
    maxPenalty: Time.hours(1),
  });
  if (!rate.ok) return resetStatus(ResetOutcome.TooManyAttempts);

  const form = submittedForm();
  const token = form.get(HOSTING_FORM_FIELDS.token) ?? "";

  if (!token) return resetStatus(ResetOutcome.InvalidLink);

  const completion = await clients.security.auth.resetPassword
    .completionForToken(token);

  if (!completion) return resetStatus(ResetOutcome.InvalidLink);

  const result = await completion.complete(
    token,
    form.get(HOSTING_FORM_FIELDS.newPassword) ?? "",
    form.get(HOSTING_FORM_FIELDS.confirmNewPassword) ?? "",
  );

  if (!result.ok) {
    switch (result.error) {
      case ResetPasswordCompleteError.PasswordsDoNotMatch:
        return resetForm(token, ResetFormError.PasswordsDoNotMatch);
      case ResetPasswordCompleteError.InvalidOrExpiredToken:
        return resetStatus(ResetOutcome.InvalidLink);
      case ResetPasswordCompleteError.TooManyRequests:
        return resetStatus(ResetOutcome.TooManyAttempts);
      default:
        return resetStatus(ResetOutcome.ResetFailed);
    }
  }

  return resetStatus(ResetOutcome.PasswordUpdated);
});
