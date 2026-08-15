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

import { AdminSignUpAccount } from "@scribe/host/dependencies/security/auth/src/sign_up/account/admin.ts";
import type { AdminSignUpPrepared } from "@scribe/host/dependencies/security/auth/src/sign_up/account/admin.ts";
import { UserSignUpAccount } from "@scribe/host/dependencies/security/auth/src/sign_up/account/user.ts";
import { EmailSignUp } from "@scribe/host/dependencies/security/auth/src/sign_up/providers/email.ts";
import { PhoneSignUp } from "@scribe/host/dependencies/security/auth/src/sign_up/providers/phone.ts";
import { SocialSignUp } from "@scribe/host/dependencies/security/auth/src/sign_up/providers/social.ts";
import { SocialProvider } from "../_core/gotrue/primitives.ts";
import type { AdminSignUp, EmailSignUpBase, UserEmailSignUp, UserPhoneSignUp, UserSocialSignUp } from "./types.ts";

export { signUpHook, SignUpProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
export type {
  SignUpHook,
  SignUpHookError,
  SignUpHookPayload,
  SignUpHookResult,
} from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
export { SocialProvider } from "../_core/gotrue/primitives.ts";
export {
  AdminEmailSignUpError,
  EmailSignUpError,
  PhoneSignUpError,
  SocialSignUpError,
  UserEmailSignUpError,
} from "./types.ts";
export type { AdminSignUp, SignUpResult, UserEmailSignUp, UserPhoneSignUp, UserSocialSignUp } from "./types.ts";

export interface SignUpRoleStrategy<
  TInput extends EmailSignUpBase,
  TPrepared = unknown,
> {
  readonly email: EmailSignUp<TInput, TPrepared>;
}

export interface UserSignUpSocialStrategy {
  readonly google: SocialSignUp<UserSocialSignUp, Record<string, never>>;
  readonly apple: SocialSignUp<UserSocialSignUp, Record<string, never>>;
}

export interface UserSignUpRoleStrategy extends SignUpRoleStrategy<UserEmailSignUp> {
  readonly phone: PhoneSignUp<UserPhoneSignUp, Record<string, never>>;
  readonly social: UserSignUpSocialStrategy;
}

class AdminSignUpRole implements SignUpRoleStrategy<AdminSignUp> {
  readonly email: EmailSignUp<AdminSignUp, AdminSignUpPrepared> = new EmailSignUp(
    new AdminSignUpAccount(),
  );
}

class UserSignUpRole implements UserSignUpRoleStrategy {
  readonly email: EmailSignUp<UserEmailSignUp, Record<string, never>> =
    new EmailSignUp(new UserSignUpAccount<UserEmailSignUp>());
  readonly phone: PhoneSignUp<UserPhoneSignUp, Record<string, never>> =
    new PhoneSignUp(new UserSignUpAccount<UserPhoneSignUp>());
  readonly social: UserSignUpSocialStrategy = {
    google: new SocialSignUp(
      SocialProvider.Google,
      new UserSignUpAccount<UserSocialSignUp>(),
    ),
    apple: new SocialSignUp(
      SocialProvider.Apple,
      new UserSignUpAccount<UserSocialSignUp>(),
    ),
  };
}

export class SignUpClient {
  readonly admin: AdminSignUpRole = new AdminSignUpRole();
  readonly user: UserSignUpRole = new UserSignUpRole();
}
