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

import type { Gender } from "@scribe/core/contracts/enums.ts";
import type { Result } from "@scribe/core/contracts/result.ts";
import type { SignUpHookError } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";

export enum EmailSignUpError {
  EmailRequired = "email_required",
  InvalidEmail = "invalid_email",
  EmailAlreadyExists = "email_already_exists",
  PasswordRequired = "password_required",
  InvalidPassword = "invalid_password",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export enum PhoneSignUpError {
  PhoneRequired = "phone_required",
  InvalidPhone = "invalid_phone",
  PhoneAlreadyExists = "phone_already_exists",
  PasswordRequired = "password_required",
  InvalidPassword = "invalid_password",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export enum SocialSignUpError {
  AccountAlreadyExists = "account_already_exists",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export enum AdminEmailSignUpError {
  InvalidFirstName = "invalid_first_name",
  InvalidLastName = "invalid_last_name",
  InvalidGender = "invalid_gender",
  InvalidBirthday = "invalid_birthday",
  InvalidPhone = "invalid_phone",
}

// deno-lint-ignore no-empty-enum
export enum UserEmailSignUpError {}

export type SignUpResult<TProviderError> = Result<
  { device_token: string },
  | TProviderError
  | AdminEmailSignUpError
  | UserEmailSignUpError
  | SignUpHookError
>;

export interface EmailSignUpBase {
  email: string;
  password: string;
  data: Record<string, unknown>;
}

export interface UserEmailSignUp extends EmailSignUpBase {}

export interface PhoneSignUpBase {
  phone: string;
  password: string;
  data: Record<string, unknown>;
}

export interface UserPhoneSignUp extends PhoneSignUpBase {}

export interface SocialSignUpBase {
  idToken: string;
  nonce: string;
  accessToken?: string;
  data: Record<string, unknown>;
}

export interface UserSocialSignUp extends SocialSignUpBase {}

export interface AdminSignUp extends EmailSignUpBase {
  phone: string;
  firstname: string;
  lastname: string;
  gender: Gender;
  birthday: number;
  role: string;
}
