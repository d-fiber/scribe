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

import type React from "react";

export type HostingContent = React.ReactElement;

export enum ConfirmAccountOutcome {
  EmailConfirmed = "email-confirmed",
  InvalidLink = "invalid-link",
  LinkExpired = "link-expired",
  TooManyAttempts = "too-many-attempts",
  ConfirmationFailed = "confirmation-failed",
}

export enum EmailChangeOutcome {
  EmailUpdated = "email-updated",
  InvalidLink = "invalid-link",
  TooManyAttempts = "too-many-attempts",
  ChangeFailed = "change-failed",
}

export enum ResetOutcome {
  PasswordUpdated = "password-updated",
  InvalidLink = "invalid-link",
  TooManyAttempts = "too-many-attempts",
  ResetFailed = "reset-failed",
}

export enum ResetFormError {
  PasswordsDoNotMatch = "passwords-do-not-match",
}

export enum VpnOutcome {
  InvalidLink = "invalid-link",
  TooManyAttempts = "too-many-attempts",
  DownloadFailed = "download-failed",
}

export enum LinkOutcome {
  InvalidLink = "invalid-link",
  TooManyAttempts = "too-many-attempts",
}

export enum LinkInterstitialKind {
  Deeplink = "deeplink",
  Redirect = "redirect",
}

export interface HostingPageData {
  readonly locale: string | null;
  readonly appName: string;
}

export interface ConfirmAccountStatusData extends HostingPageData {
  readonly outcome: ConfirmAccountOutcome;
}

export interface ConfirmAccountDeeplinkData extends HostingPageData {
  readonly href: string;
}

export type NotFoundData = HostingPageData;

export interface EmailChangeStatusData extends HostingPageData {
  readonly outcome: EmailChangeOutcome;
}

export interface ResetStatusData extends HostingPageData {
  readonly outcome: ResetOutcome;
}

export interface ResetFormData extends HostingPageData {
  readonly token: string;
  readonly error: ResetFormError | null;
}

export interface VpnStatusData extends HostingPageData {
  readonly outcome: VpnOutcome;
}

export type VpnDownloadData = HostingPageData;

export interface LinkStatusData extends HostingPageData {
  readonly outcome: LinkOutcome;
}

export interface LinkInterstitialPreview {
  readonly title: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
}

export interface LinkInterstitialData extends HostingPageData {
  readonly kind: LinkInterstitialKind;
  readonly target: string;
  readonly fallbackUrl: string | null;
  readonly beaconUrl: string;
  readonly preview: LinkInterstitialPreview | null;
}

const _CONFIRM_ACCOUNT_STATUS_CODES: Record<ConfirmAccountOutcome, number> = {
  [ConfirmAccountOutcome.EmailConfirmed]: 200,
  [ConfirmAccountOutcome.InvalidLink]: 400,
  [ConfirmAccountOutcome.LinkExpired]: 400,
  [ConfirmAccountOutcome.TooManyAttempts]: 429,
  [ConfirmAccountOutcome.ConfirmationFailed]: 400,
};

const _EMAIL_CHANGE_STATUS_CODES: Record<EmailChangeOutcome, number> = {
  [EmailChangeOutcome.EmailUpdated]: 200,
  [EmailChangeOutcome.InvalidLink]: 400,
  [EmailChangeOutcome.TooManyAttempts]: 429,
  [EmailChangeOutcome.ChangeFailed]: 400,
};

const _RESET_STATUS_CODES: Record<ResetOutcome, number> = {
  [ResetOutcome.PasswordUpdated]: 200,
  [ResetOutcome.InvalidLink]: 400,
  [ResetOutcome.TooManyAttempts]: 429,
  [ResetOutcome.ResetFailed]: 400,
};

const _VPN_STATUS_CODES: Record<VpnOutcome, number> = {
  [VpnOutcome.InvalidLink]: 400,
  [VpnOutcome.TooManyAttempts]: 429,
  [VpnOutcome.DownloadFailed]: 400,
};

const _LINK_STATUS_CODES: Record<LinkOutcome, number> = {
  [LinkOutcome.InvalidLink]: 404,
  [LinkOutcome.TooManyAttempts]: 429,
};

export const HostingStatus = {
  confirmAccount: (outcome: ConfirmAccountOutcome): number => _CONFIRM_ACCOUNT_STATUS_CODES[outcome],
  emailChange: (outcome: EmailChangeOutcome): number => _EMAIL_CHANGE_STATUS_CODES[outcome],
  reset: (outcome: ResetOutcome): number => _RESET_STATUS_CODES[outcome],
  vpn: (outcome: VpnOutcome): number => _VPN_STATUS_CODES[outcome],
  link: (outcome: LinkOutcome): number => _LINK_STATUS_CODES[outcome],
};

export const HOSTING_FORM_FIELDS = {
  token: "token",
  newPassword: "new_password",
  confirmNewPassword: "confirm_new_password",
} as const;

export const HOSTING_FORM_ACTIONS = {
  reset: "reset",
  vpn: "vpn",
} as const;

export const LINK_BEACON_OUTCOMES = {
  redirected: "redirected",
  openedApp: "opened_app",
  storeFallback: "store_fallback",
} as const;

export type LinkBeaconOutcome = (typeof LINK_BEACON_OUTCOMES)[keyof typeof LINK_BEACON_OUTCOMES];

export const LINK_FALLBACK_DELAY_MS = 1_500;
