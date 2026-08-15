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

import { UserClient } from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import { AuthCache } from "./_core/cache.ts";
import { ResetPasswordClient } from "./reset_password/reset_password.ts";
import { SessionClient } from "./session/session.ts";
import { SignInClient } from "./sign_in/sign_in.ts";
import { SignUpClient } from "./sign_up/sign_up.ts";

export type {
  DeleteUserError,
  DeleteUserResult,
  UpdateUserEmailError,
  UpdateUserEmailResult,
  UpdateUserPasswordError,
  UpdateUserPasswordResult,
  UpdateUserPhoneError,
  UpdateUserPhoneResult,
} from "@scribe/host/dependencies/security/auth/src/user/user.ts";

export { AuthMapper } from "./_core/mappers.ts";
export { SmsIntent } from "./_core/cache.ts";
export { EmailResetPasswordError, PhoneResetPasswordError } from "./reset_password/reset_password.ts";
export type { EmailResetPasswordResult, PhoneResetPasswordResult } from "./reset_password/reset_password.ts";
export type {
  DeleteAccountError,
  DeleteAccountResult,
  DevicesError,
  DevicesResult,
  RecoverSessionError,
  RecoverSessionResult,
  RefreshSessionError,
  RefreshSessionResult,
  SessionResultData,
  SignOutError,
  SignOutResult,
  UpdatePasswordError,
  UpdatePasswordResult,
  UserDeviceCheckResult,
  UserDeviceRecord,
} from "./session/session.ts";
export {
  ConfirmEmailError,
  EmailSignInError,
  PhoneSignInError,
  ResendError,
  SocialSignInError,
  VerifyOtpError,
} from "./sign_in/sign_in.ts";
export type { ConfirmEmailResult, ConfirmEmailSession, ResendResult, VerifyOtpOutcome } from "./sign_in/sign_in.ts";
export {
  AdminEmailSignUpError,
  EmailSignUpError,
  PhoneSignUpError,
  SocialSignUpError,
  UserEmailSignUpError,
} from "./sign_up/sign_up.ts";
export type { SignUpResult } from "./sign_up/sign_up.ts";

export class AuthClient {
  readonly smsIntent = AuthCache.smsIntent;
  readonly signIn: SignInClient = new SignInClient();
  readonly signUp: SignUpClient = new SignUpClient();
  readonly resetPassword: ResetPasswordClient = new ResetPasswordClient();
  readonly session: SessionClient = new SessionClient();
  readonly user: UserClient = new UserClient();
}

export const auth: AuthClient = new AuthClient();
