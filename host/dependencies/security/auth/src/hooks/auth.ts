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

import type { AccountRole } from "@scribe/core/contracts/account.ts";
import { OK, type Result } from "@scribe/core/contracts/result.ts";
import { defineHook, type Hook, type HookHandler } from "@scribe/host/packages/foundation/event_driven/hook/mod.ts";

export enum SignInProvider {
  Email = "email",
  Phone = "phone",
  Social = "social",
}

export interface SignInHookPayload {
  userId: string;
  role: AccountRole;
  provider: SignInProvider;
}

export type SignInHook = HookHandler<SignInHookPayload>;

export const signInHook: Hook<SignInHookPayload, void> = defineHook<SignInHookPayload>({
  name: "auth.sign-in",
});

export enum SignUpProvider {
  Email = "email",
  Phone = "phone",
  Social = "social",
}

export interface SignUpHookPayload {
  userId: string;
  role: AccountRole;
  provider: SignUpProvider;
  data?: Record<string, unknown>;
}

export interface SignUpHookError {
  code: string;
  message: string;
}

export type SignUpHookResult = Result<void, SignUpHookError>;

export type SignUpHook = HookHandler<SignUpHookPayload, SignUpHookResult>;

export const signUpHook: Hook<SignUpHookPayload, SignUpHookResult> = defineHook<SignUpHookPayload, SignUpHookResult>({
  name: "auth.sign-up",
  fallback: new OK(),
});

export enum ResetPasswordProvider {
  Email = "email",
  Phone = "phone",
  Social = "social",
}

export interface ResetPasswordHookPayload {
  email: string | null;
  phone: string | null;
  role: AccountRole;
  provider: ResetPasswordProvider;
}

export type ResetPasswordHook = HookHandler<ResetPasswordHookPayload>;

export const resetPasswordHook: Hook<ResetPasswordHookPayload, void> = defineHook<ResetPasswordHookPayload>({
  name: "auth.reset-password",
});
