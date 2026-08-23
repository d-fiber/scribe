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

import type { LatLng } from "@scribe/alchemy";
import type { Metadata } from "@scribe/core/contracts/common/metadata.ts";
import type { ClientType, DeviceCategory, DeviceOs } from "@scribe/core/contracts/enums.ts";

export enum SignOutScope {
  Local = "local",
  Global = "global",
}

export enum AccountRole {
  Admin = "admin",
  User = "user",
}

export type SessionUser = {
  id: string;
  email: string | null;
};

export interface Rules {
  role: string;
  permissions: string[];
}

export type SessionAdmin = {
  id: string;
  email: string;
  rules: Rules;
};

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user?: SessionUser | SessionAdmin;
};

export interface UserDevice {
  id: string;
  device_id: string;
  client: ClientType;
  os: DeviceOs;
  model: string;
  is_physical_device: boolean;
  device_category: DeviceCategory;
  notification_token: string | null;
  location: LatLng | null;
  ip: string;
  city: string;
  country: string;
  metadata: Metadata;
}

export interface AdminDevice {
  id: string;
  device_id: string;
  client: ClientType;
  os: DeviceOs;
  model: string;
  is_physical_device: boolean;
  device_category: DeviceCategory;
  ip: string;
  city: string;
  country: string;
  metadata: Metadata;
}

export interface AccountRoleSource {
  withId(id: string): Promise<AccountRole | null>;
}
