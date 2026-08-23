// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import { ClientType, DeviceCategory, DeviceOs, DeviceThemeMode, Localization } from "@scribe/core/contracts/enums.ts";
import { boundedString, oneOf, optionalBoundedString, optionalSizedString } from "./fields.ts";
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
