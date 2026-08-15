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

import type { Location } from "@scribe/core/contracts/common/location.ts";
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
  location: Location | null;
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
