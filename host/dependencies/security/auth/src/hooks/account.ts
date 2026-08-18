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

import {
  Hook,
  type HookHandler,
} from "@scribe/foundation/src/hook/mod.ts";

export type DeletedHook = HookHandler<string>;
export const userDeleteHook: Hook<string, void> = new Hook<string>({
  name: "account.deleted",
});

export interface SignOutHookPayload {
  userId: string;
  deviceId: string | null;
}

export type SignOutHook = HookHandler<SignOutHookPayload>;
export const signOutHook: Hook<SignOutHookPayload, void> = new Hook<SignOutHookPayload>({
  name: "account.sign-out",
});

export interface UpdatePasswordHookPayload {
  userId: string;
}

export type UpdatePasswordHook = HookHandler<UpdatePasswordHookPayload>;
export const updateUserPasswordHook: Hook<UpdatePasswordHookPayload, void> = new Hook<UpdatePasswordHookPayload>({
  name: "account.update-password",
});

export interface UpdateEmailHookPayload {
  userId: string;
  email: string;
}

export type UpdateEmailHook = HookHandler<UpdateEmailHookPayload>;
export const updateUserEmailHook: Hook<UpdateEmailHookPayload, void> = new Hook<UpdateEmailHookPayload>({
  name: "account.update-email",
});

export interface UpdatePhoneHookPayload {
  userId: string;
  phone: string;
}

export type UpdatePhoneHook = HookHandler<UpdatePhoneHookPayload>;
export const updateUserPhoneHook: Hook<UpdatePhoneHookPayload, void> = new Hook<UpdatePhoneHookPayload>({
  name: "account.update-phone",
});

export interface DeviceInsertHookPayload {
  userId: string;
  deviceId: string;
}

export type DeviceInsertHook = HookHandler<DeviceInsertHookPayload>;
export const deviceInsertHook: Hook<DeviceInsertHookPayload, void> = new Hook<DeviceInsertHookPayload>({
  name: "account.device-insert",
});

export interface DeviceDeleteHookPayload {
  userId: string;
  deviceId: string;
}

export type DeviceDeleteHook = HookHandler<DeviceDeleteHookPayload>;
export const deviceDeleteHook: Hook<DeviceDeleteHookPayload, void> = new Hook<DeviceDeleteHookPayload>({
  name: "account.device-delete",
});
