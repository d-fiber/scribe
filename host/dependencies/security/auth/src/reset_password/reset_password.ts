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

import { PendingToken, PendingTokenPurpose } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import { ResetPasswordCompletion } from "@scribe/host/dependencies/security/auth/src/reset_password/completion.ts";
import { EmailResetPassword } from "@scribe/host/dependencies/security/auth/src/reset_password/providers/email.ts";
import { PhoneResetPassword } from "@scribe/host/dependencies/security/auth/src/reset_password/providers/phone.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";

export { ResetPasswordCompleteError } from "@scribe/host/dependencies/security/auth/src/reset_password/completion.ts";
export type { ResetPasswordCompleteResult } from "@scribe/host/dependencies/security/auth/src/reset_password/completion.ts";
export { EmailResetPasswordError } from "@scribe/host/dependencies/security/auth/src/reset_password/providers/email.ts";
export type { EmailResetPasswordResult } from "@scribe/host/dependencies/security/auth/src/reset_password/providers/email.ts";
export {
  PhoneResetPasswordError,
  VerifyPhoneResetOtpError,
} from "@scribe/host/dependencies/security/auth/src/reset_password/providers/phone.ts";
export type {
  PhoneResetPasswordResult,
  VerifyPhoneResetOtpResult,
} from "@scribe/host/dependencies/security/auth/src/reset_password/providers/phone.ts";
export { resetPasswordHook, ResetPasswordProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
export type { ResetPasswordHook, ResetPasswordHookPayload } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";

class AdminResetPassword {
  readonly email: EmailResetPassword = new EmailResetPassword(AccountRole.Admin);
  readonly completion: ResetPasswordCompletion = new ResetPasswordCompletion(AccountRole.Admin);
}

class UserResetPassword {
  readonly email: EmailResetPassword = new EmailResetPassword(AccountRole.User);
  readonly phone: PhoneResetPassword = new PhoneResetPassword(AccountRole.User);
  readonly completion: ResetPasswordCompletion = new ResetPasswordCompletion(AccountRole.User);
}

export class ResetPasswordClient {
  readonly #token = new PendingToken(PendingTokenPurpose.PasswordReset);

  readonly admin: AdminResetPassword = new AdminResetPassword();
  readonly user: UserResetPassword = new UserResetPassword();

  completionFor(role: AccountRole): ResetPasswordCompletion {
    return role === AccountRole.Admin ? this.admin.completion : this.user.completion;
  }

  async completionForToken(
    token: string,
  ): Promise<ResetPasswordCompletion | null> {
    const payload = await this.#token.payload(token.trim());
    return payload ? this.completionFor(payload.role) : null;
  }
}
