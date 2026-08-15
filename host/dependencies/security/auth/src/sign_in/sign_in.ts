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
import { EmailSignIn } from "@scribe/host/dependencies/security/auth/src/sign_in/providers/email.ts";
import { PhoneSignIn } from "@scribe/host/dependencies/security/auth/src/sign_in/providers/phone.ts";
import { SocialSignIn } from "@scribe/host/dependencies/security/auth/src/sign_in/providers/social.ts";
import { IntraSignIn } from "@scribe/host/dependencies/security/auth/src/sign_in/providers/intra.ts";
import { SocialProvider } from "../_core/gotrue/primitives.ts";

export { ConfirmEmailError, EmailSignInError, PhoneSignInError, SocialSignInError } from "./types.ts";
export type {
  ConfirmEmailResult,
  ConfirmEmailSession,
  EmailSignInResult,
  PhoneSignInResult,
  SocialSignInResult,
} from "./types.ts";
export { signInHook, SignInProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
export type { SignInHook, SignInHookPayload } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
export { ResendError, VerifyOtpError } from "./_otp/otp_challenge.ts";
export type { ResendResult, VerifyOtpOutcome, VerifyOtpResult } from "./_otp/otp_challenge.ts";
export { SocialProvider } from "../_core/gotrue/primitives.ts";

export interface SignInRoleStrategy {
  readonly expectedRole: AccountRole;
  readonly email: EmailSignIn;
}

export interface UserSignInSocialStrategy {
  readonly google: SocialSignIn;
  readonly apple: SocialSignIn;
}

export interface UserSignInRoleStrategy extends SignInRoleStrategy {
  readonly phone: PhoneSignIn;
  readonly social: UserSignInSocialStrategy;
}

class AdminSignIn implements SignInRoleStrategy {
  readonly expectedRole = AccountRole.Admin;
  readonly email: EmailSignIn = new EmailSignIn(this.expectedRole);
  readonly intra: IntraSignIn = new IntraSignIn();
}

class UserSignIn implements UserSignInRoleStrategy {
  readonly expectedRole = AccountRole.User;
  readonly email: EmailSignIn = new EmailSignIn(this.expectedRole);
  readonly phone: PhoneSignIn = new PhoneSignIn(this.expectedRole);
  readonly social: UserSignInSocialStrategy = {
    google: new SocialSignIn(SocialProvider.Google, this.expectedRole),
    apple: new SocialSignIn(SocialProvider.Apple, this.expectedRole),
  };
}

export class SignInClient {
  readonly admin: AdminSignIn = new AdminSignIn();
  readonly user: UserSignIn = new UserSignIn();
}
