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

import type { Session } from "@scribe/core/contracts/account.ts";
import type { Result } from "@scribe/core/contracts/result.ts";

export type AuthenticatedSession = Session & {
  user: NonNullable<Session["user"]>;
  access_token: string;
};

export enum EmailSignInError {
  EmailRequired = "email_required",
  PasswordRequired = "password_required",
  InvalidCredentials = "invalid_credentials",
  EmailNotConfirmed = "email_not_confirmed",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type EmailSignInResult = Result<
  Session | { pendingToken: string },
  EmailSignInError
>;

export enum PhoneSignInError {
  PhoneRequired = "phone_required",
  PasswordRequired = "password_required",
  InvalidCredentials = "invalid_credentials",
  PhoneNotConfirmed = "phone_not_confirmed",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type PhoneSignInResult = Result<
  Session | { pendingToken: string },
  PhoneSignInError
>;

export enum SocialSignInError {
  SignInFailed = "sign_in_failed",
  TooManyRequests = "too_many_requests",
  Unexpected = "unexpected",
}

export type SocialSignInSession = AuthenticatedSession & {
  device_token: string;
};

export type SocialSignInResult = Result<
  SocialSignInSession,
  SocialSignInError
>;

export enum ConfirmEmailError {
  Expired = "expired",
  Failed = "failed",
}

export type ConfirmEmailSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export type ConfirmEmailResult = Result<
  ConfirmEmailSession | null,
  ConfirmEmailError
>;
