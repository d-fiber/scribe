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

import type { ClientType, DeviceCategory, DeviceOs, DeviceThemeMode, Localization } from "@scribe/contracts/enums.ts";

/**
 * The device claims a caller sends with a request, decrypted from its encrypted payload.
 *
 * @remarks
 * `DevicePayloadValidator.validate` produces this shape only once the payload has been decrypted,
 * its binding matches the request it rode with, and its `iat` is still fresh, so a caller cannot
 * forge these fields without the deployment's own private key. Nothing here proves the device
 * itself is telling the truth about its hardware or its build.
 */
export interface RequestDevice {
  /** What the caller calls this device, kept across launches of the application. */
  device_id: string;

  /** Which kind of program is calling. */
  client: ClientType;

  /** Which operating system the device runs. */
  os: DeviceOs;

  /** Which model of hardware, as the platform reports it. */
  model: string;

  /** Which build of the application is calling, when it says. */
  app_version?: string;

  /** Whether this is a real handset rather than a simulator or emulator. */
  is_physical_device: boolean;

  /** What kind of device it is, such as a phone or a tablet. */
  device_category: DeviceCategory;

  /** Where a push notification reaches this device, when it accepted them. */
  notification_token?: string;

  /** What this device holds to prove it is the same one across calls, when it holds one. */
  device_token?: string;

  /** What the device asks to be answered in. */
  localization: Localization;

  /** Whether the device is asking for the light or the dark rendering. */
  theme_mode: DeviceThemeMode;

  /** What binds this payload to the request it rode in on; `DevicePayloadValidator` refuses a mismatch. */
  binding: string;

  /** When this payload was issued, checked for staleness before it is accepted. */
  iat: number;

  /** What makes this payload usable once and no more, claimed through `claimNonce`. */
  nonce?: string;
}
