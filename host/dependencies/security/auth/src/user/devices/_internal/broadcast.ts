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

import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Realtime } from "@scribe/realtime/mod.ts";

/** What a device event carries to the account the device belongs to. */
export interface DeviceEvent {
  /** The identifier of the device the event is about. */
  deviceId: string;
}

/**
 * The two channels devices are announced on, one per family of accounts.
 *
 * They are declared apart rather than sharing one name because the two families are addressed
 * by the same subject in a token: a single channel would let whichever persona holds that
 * subject hear the other's devices.
 */
const CHANNELS: Readonly<Record<AccountRole, Realtime<DeviceEvent>>> = {
  [AccountRole.User]: Realtime.granted<DeviceEvent>("user_device", { key: "deviceId" }),
  [AccountRole.Admin]: Realtime.granted<DeviceEvent>("admin_device", { key: "deviceId" }),
};

/** Announces what happens to the devices of one family of accounts. */
export class DeviceBroadcast {
  /** Which family of accounts this instance announces to. */
  readonly kind: AccountRole;

  constructor(kind: AccountRole) {
    this.kind = kind;
  }

  /** Announces that `deviceId` was added to `accountId`. */
  insert(accountId: string, deviceId: string): Promise<boolean> {
    return this.#channel().to(accountId).insert({ deviceId });
  }

  /** Announces that `deviceId` changed on `accountId`. */
  update(accountId: string, deviceId: string): Promise<boolean> {
    return this.#channel().to(accountId).update({ deviceId });
  }

  /** Announces that `deviceId` was removed from `accountId`. */
  delete(accountId: string, deviceId: string): Promise<boolean> {
    return this.#channel().to(accountId).delete({ deviceId });
  }

  /** Announces that `deviceId` was signed out of `accountId`. */
  signOut(accountId: string, deviceId: string): Promise<boolean> {
    return this.#channel().to(accountId).emit("sign_out", { deviceId });
  }

  #channel(): Realtime<DeviceEvent> {
    return CHANNELS[this.kind];
  }
}

/** One broadcaster per family of accounts, ready to use. */
export class DeviceBroadcasts {
  /** Announces to the devices of a user. */
  static readonly user: DeviceBroadcast = new DeviceBroadcast(AccountRole.User);

  /** Announces to the devices of an admin. */
  static readonly admin: DeviceBroadcast = new DeviceBroadcast(AccountRole.Admin);
}
