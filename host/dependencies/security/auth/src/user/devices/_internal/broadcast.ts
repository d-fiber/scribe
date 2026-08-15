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
import { defineRealtime, event } from "@scribe/host/dependencies/database/realtime/mod.ts";

const devices = defineRealtime({
  entity: "devices",
  scopes: ["to"],
  events: {
    inserted: event("insert"),
    updated: event("update"),
    deleted: event("delete"),
    signedOut: event("sign_out"),
  },
});

export class DeviceBroadcast {
  constructor(readonly kind: AccountRole) {}

  insert(accountId: string, deviceId: string): Promise<boolean> {
    return this.#emit(devices.inserted, accountId, deviceId);
  }

  update(accountId: string, deviceId: string): Promise<boolean> {
    return this.#emit(devices.updated, accountId, deviceId);
  }

  delete(accountId: string, deviceId: string): Promise<boolean> {
    return this.#emit(devices.deleted, accountId, deviceId);
  }

  signOut(accountId: string, deviceId: string): Promise<boolean> {
    return this.#emit(devices.signedOut, accountId, deviceId);
  }

  #emit(
    target: { readonly to: { admin: DeviceEmit; user: DeviceEmit } },
    accountId: string,
    deviceId: string,
  ): Promise<boolean> {
    return this.kind === AccountRole.Admin
      ? target.to.admin(deviceId, accountId)
      : target.to.user(deviceId, accountId);
  }
}

type DeviceEmit = (id: string, accountId: string) => Promise<boolean>;

export class DeviceBroadcasts {
  static readonly user: DeviceBroadcast = new DeviceBroadcast(AccountRole.User);
  static readonly admin: DeviceBroadcast = new DeviceBroadcast(AccountRole.Admin);
}
