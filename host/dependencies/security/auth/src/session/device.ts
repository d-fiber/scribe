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

import { CurrentSessionResolver } from "@scribe/host/dependencies/security/auth/src/_core/current_session.ts";
import { DevicesClient } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import type { AdminDevice, UserDevice } from "@scribe/core/contracts/account.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { currentLocation } from "@scribe/core/runtime/http/accessors/location.ts";
import { request } from "@scribe/core/runtime/http/request.ts";

export enum DevicesError {
  Unauthorized = "unauthorized",
  Unexpected = "unexpected",
}

export type DevicesResult = Result<UserDevice[] | AdminDevice[], DevicesError>;

export enum RevokeDeviceError {
  Unauthorized = "unauthorized",
  NotFound = "not_found",
  CurrentDevice = "current_device",
  Unexpected = "unexpected",
}

export type RevokeDeviceResult = Result<void, RevokeDeviceError>;

export class SessionDeviceClient {
  readonly #devices = new DevicesClient();

  async current(): Promise<UserDevice | AdminDevice | null> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return null;

    const deviceId = await CurrentSessionResolver.deviceId();
    if (!deviceId) return null;

    return this.#devices.get(deviceId, session.userId);
  }

  async devices(): Promise<DevicesResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(DevicesError.Unauthorized);

    return new OK(await this.#devices.getAll(session.userId));
  }

  async refresh(): Promise<boolean> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return false;

    const device = await requestDevice();
    if (!device) return false;

    const { city, country } = await currentLocation();

    return this.#devices.refresh(session.userId, device.device_id, {
      ip: request.ip(),
      city,
      country,
      appVersion: device.app_version,
    });
  }

  async delete(): Promise<boolean> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return false;

    const deviceId = await CurrentSessionResolver.deviceId();
    if (!deviceId) return false;

    return this.#devices.delete(deviceId, session.userId);
  }

  async revoke(deviceId: string): Promise<RevokeDeviceResult> {
    const session = CurrentSessionResolver.resolve();
    if (!session) return new Failure(RevokeDeviceError.Unauthorized);

    if (deviceId === (await CurrentSessionResolver.deviceId())) {
      return new Failure(RevokeDeviceError.CurrentDevice);
    }

    const owned = await this.#devices.get(deviceId, session.userId);
    if (!owned) return new Failure(RevokeDeviceError.NotFound);

    if (!(await this.#devices.delete(deviceId, session.userId))) {
      return new Failure(RevokeDeviceError.Unexpected);
    }

    await this.#devices.endSession(session.userId, deviceId);

    return new OK();
  }
}
