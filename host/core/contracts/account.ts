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

/** What an identity service hands back once it has let somebody in. */
export type Session = {
  /** The bearer token calls are made with. */
  access_token: string;

  /** What is exchanged for a new access token once this one lapses. */
  refresh_token: string;

  /** How many seconds the access token is good for. */
  expires_in: number;

  /** What kind of token the access token is, which is `bearer` everywhere so far. */
  token_type: string;

  /** Who was let in, as the identity service describes them, when it says at all. */
  user?: { id: string; [claim: string]: unknown };
};

/**
 * One device an account has been seen on.
 *
 * @remarks
 * There is one shape and not one per kind of account. What a deployment records about a device is
 * the same fact whoever is holding it, and having two shapes meant every reader had to know which
 * population a row came from before it could read it.
 *
 * `location` is absent when nothing placed the device, which is the usual case for anything that
 * did not ask for the permission.
 */
export interface AccountDevice {
  /** What identifies this row. */
  id: string;

  /** What the device calls itself, which is what two sessions on one handset share. */
  device_id: string;

  /** Which kind of client is installed on it. */
  client: ClientType;

  /** Which operating system it runs. */
  os: DeviceOs;

  /** What the manufacturer calls it. */
  model: string;

  /** Whether it is a real device rather than a simulator. */
  is_physical_device: boolean;

  /** How big a screen it is, in one word. */
  device_category: DeviceCategory;

  /** What a push is addressed to, or null when nothing may be pushed to it. */
  notification_token: string | null;

  /** Where it was last placed, or null when nothing placed it. */
  location: LatLng | null;

  /** The address it was last seen from. */
  ip: string;

  /** The city that address resolved to. */
  city: string;

  /** The country that address resolved to. */
  country: string;

  /** Everything else the deployment records about it. */
  metadata: Metadata;
}
