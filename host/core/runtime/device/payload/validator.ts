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

import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import {
  ClientType,
  DeviceCategory,
  DeviceOs,
  DeviceThemeMode,
  Localization,
} from "@scribe/core/contracts/enums.ts";
import {
  boundedString,
  oneOf,
  optionalBoundedString,
  optionalSizedString,
} from "./fields.ts";
import { isFresh } from "./freshness.ts";

const MIN_NONCE_LENGTH = 16;
const MAX_NONCE_LENGTH = 128;

const MAX_DEVICE_ID_LENGTH = 256;
const MAX_MODEL_LENGTH = 255;
const MAX_APP_VERSION_LENGTH = 32;
const MAX_NOTIFICATION_TOKEN_LENGTH = 512;
const MAX_DEVICE_TOKEN_LENGTH = 128;

type FieldRule = (payload: Partial<RequestDevice>) => boolean;

const FIELD_RULES: readonly FieldRule[] = [
  (payload) => boundedString(payload.device_id, MAX_DEVICE_ID_LENGTH),
  (payload) => boundedString(payload.model, MAX_MODEL_LENGTH),
  (payload) => optionalBoundedString(payload.app_version, MAX_APP_VERSION_LENGTH),
  (payload) =>
    optionalBoundedString(
      payload.notification_token,
      MAX_NOTIFICATION_TOKEN_LENGTH,
    ),
  (payload) =>
    optionalBoundedString(payload.device_token, MAX_DEVICE_TOKEN_LENGTH),
  (payload) =>
    optionalSizedString(payload.nonce, MIN_NONCE_LENGTH, MAX_NONCE_LENGTH),
  (payload) => typeof payload.is_physical_device === "boolean",
  (payload) => oneOf(payload.client, ClientType),
  (payload) => oneOf(payload.os, DeviceOs),
  (payload) => oneOf(payload.device_category, DeviceCategory),
  (payload) => oneOf(payload.localization, Localization),
  (payload) => oneOf(payload.theme_mode, DeviceThemeMode),
];

export class DevicePayloadValidator {
  static validate(raw: unknown, expectedBinding: string): RequestDevice | null {
    if (typeof raw !== "object" || raw === null) return null;

    const payload = raw as Partial<RequestDevice>;
    if (payload.binding !== expectedBinding) return null;
    if (!isFresh(payload.iat)) return null;

    return FIELD_RULES.every((rule) => rule(payload))
      ? (payload as RequestDevice)
      : null;
  }
}
