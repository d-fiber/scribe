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

import { AuthCache } from "@scribe/host/dependencies/security/auth/src/_core/cache.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import {
  type DeviceBroadcast,
  DeviceBroadcasts,
} from "@scribe/host/dependencies/security/auth/src/user/devices/_internal/broadcast.ts";
import { DeviceMapper } from "@scribe/host/dependencies/security/auth/src/user/devices/_internal/mapper.ts";
import { DeviceOwnerResolver } from "@scribe/host/dependencies/security/auth/src/user/devices/_internal/owner_resolver.ts";
import type { DeviceMetadata } from "@scribe/host/dependencies/security/auth/src/user/devices/_internal/repository.ts";
import {
  type DeviceHardwareResult,
  DeviceRepositories,
} from "@scribe/host/dependencies/security/auth/src/user/devices/_internal/repository.ts";
import type { AdminDevice, UserDevice } from "@scribe/core/contracts/account.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { constantTimeEqual } from "@scribe/core/runtime/support/crypto/constant_time.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { request } from "@scribe/core/runtime/http/request.ts";

export type { DeviceMetadata };

import { deviceDeleteHook, deviceInsertHook } from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export type {
  DeviceDeleteHook,
  DeviceDeleteHookPayload,
  DeviceInsertHook,
  DeviceInsertHookPayload,
} from "@scribe/host/dependencies/security/auth/src/hooks/account.ts";
export { deviceDeleteHook, deviceInsertHook };

export enum DeviceCheckResult {
  Ok = "ok",
  NotFound = "not_found",
  Tampered = "tampered",
  Unexpected = "unexpected",
}

const TRUST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export class DevicesClient {
  readonly #repos: DeviceRepositories;
  readonly #owner: DeviceOwnerResolver;

  constructor() {
    this.#repos = new DeviceRepositories();
    this.#owner = new DeviceOwnerResolver(this.#repos.user, this.#repos.admin);
  }

  async insert(userId: string): Promise<string | null> {
    const device = await requestDevice();
    if (!device) return null;

    const repository = await this.#owner.resolve(userId);
    if (!repository) return null;

    const deviceRowId = await repository.getId(userId, device.device_id);

    if (deviceRowId) {
      const refreshed = await repository.refreshHash(userId, deviceRowId);
      if (!refreshed) return null;

      await Promise.all([
        AuthCache.device.invalidate(userId, device.device_id),
        AuthCache.devices.invalidate(userId),
        this.#broadcastFor(repository.kind).update(userId, device.device_id),
      ]);
      return refreshed.token;
    }

    try {
      await deviceInsertHook.run({ userId, deviceId: device.device_id });
    } catch {
      return null;
    }

    const result = await repository.insert(userId);
    if (!result) return null;

    await Promise.all([
      AuthCache.devices.invalidate(userId),
      this.#broadcastFor(repository.kind).insert(
        userId,
        result.device.device_id,
      ),
    ]);
    return result.token;
  }

  async verify(userId: string): Promise<DeviceCheckResult> {
    const device = await requestDevice();
    if (!device) return DeviceCheckResult.Unexpected;

    const hardware = await this.#hardwareOf(userId, device.device_id);
    if (!hardware) {
      await this.#forceSignOut();
      return DeviceCheckResult.NotFound;
    }

    if (
      hardware.os !== device.os ||
      hardware.model !== device.model ||
      hardware.is_physical_device !== device.is_physical_device ||
      hardware.device_category !== device.device_category
    ) {
      await this.#forceSignOut();
      return DeviceCheckResult.Tampered;
    }

    return DeviceCheckResult.Ok;
  }

  async isTrust(deviceId: string, userId: string): Promise<boolean> {
    const device = await requestDevice();
    if (!device?.device_token) return false;

    const record = await this.#firstNonNull(
      this.#repos.user.isTrusted(userId, deviceId),
      this.#repos.admin.isTrusted(userId, deviceId),
    );
    if (!record?.hash) return false;

    if (record.trusted_at < Date.now() - TRUST_WINDOW_MS) return false;

    return constantTimeEqual(await sha256Hex(device.device_token), record.hash);
  }

  async delete(deviceId: string, userId: string): Promise<boolean> {
    const [userRowId, adminRowId] = await Promise.all([
      this.#repos.user.getId(userId, deviceId),
      this.#repos.admin.getId(userId, deviceId),
    ]);

    const repo = userRowId ? this.#repos.user : adminRowId ? this.#repos.admin : null;
    if (!repo) return false;

    try {
      await deviceDeleteHook.run({ userId, deviceId });
    } catch {
      return false;
    }

    const deleted = await repo.delete(userId, deviceId);

    if (!deleted) {
      console.error(
        `[device-delete] divergence: deviceDeleteHook succeeded but deletion failed for ${userId}/${deviceId}, the device still exists`,
      );
      return false;
    }

    await Promise.all([
      AuthCache.hardware.invalidate(userId, deviceId),
      AuthCache.device.invalidate(userId, deviceId),
      AuthCache.devices.invalidate(userId),
      this.#broadcastFor(repo.kind).delete(userId, deviceId),
    ]);
    return true;
  }

  async refresh(
    userId: string,
    deviceId: string,
    metadata: DeviceMetadata,
  ): Promise<boolean> {
    const repository = await this.#owner.resolve(userId);
    if (!repository) return false;

    const ok = await repository.refreshMetadata(userId, deviceId, metadata);
    if (!ok) return false;

    await Promise.all([
      AuthCache.device.invalidate(userId, deviceId),
      AuthCache.devices.invalidate(userId),
    ]);
    return true;
  }

  async endSession(userId: string, deviceId?: string): Promise<void> {
    const repository = await this.#owner.resolve(userId);

    await Promise.all([
      AuthCache.devices.invalidate(userId),
      deviceId && AuthCache.device.invalidate(userId, deviceId),
      deviceId &&
      repository &&
      this.#broadcastFor(repository.kind).signOut(userId, deviceId),
    ]);
  }

  async endAllSessions(userId: string): Promise<void> {
    const devices = await this.getAll(userId);
    await Promise.all(
      devices.map((device) => this.endSession(userId, device.device_id)),
    );
  }

  async get(
    deviceId: string,
    userId: string,
  ): Promise<UserDevice | AdminDevice | null> {
    const cached = await AuthCache.device.get(userId, deviceId);
    if (cached !== null) return cached;

    const raw = await this.#firstNonNull(
      this.#repos.user.get(userId, deviceId),
      this.#repos.admin.get(userId, deviceId),
    );
    const mapped = raw ? DeviceMapper.map<UserDevice | AdminDevice>(raw) : null;
    if (mapped) await AuthCache.device.remember(userId, deviceId, mapped);
    return mapped;
  }

  async getAll(userId: string): Promise<UserDevice[] | AdminDevice[]> {
    const cached = await AuthCache.devices.list(userId);
    if (cached !== null) return cached;

    const [userRows, adminRows] = await Promise.all([
      this.#repos.user.getAll(userId),
      this.#repos.admin.getAll(userId),
    ]);

    const result = userRows.length > 0
      ? userRows.map((r) => DeviceMapper.map<UserDevice>(r))
      : adminRows.map((r) => DeviceMapper.map<AdminDevice>(r));

    await AuthCache.devices.remember(userId, result);
    return result;
  }

  #broadcastFor(kind: AccountRole): DeviceBroadcast {
    return kind === AccountRole.User ? DeviceBroadcasts.user : DeviceBroadcasts.admin;
  }

  async #hardwareOf(
    userId: string,
    deviceId: string,
  ): Promise<DeviceHardwareResult | null> {
    const cached = await AuthCache.hardware.get<DeviceHardwareResult>(
      userId,
      deviceId,
    );
    if (cached !== null) return cached;

    const hardware = await this.#firstNonNull(
      this.#repos.user.hardware(userId, deviceId),
      this.#repos.admin.hardware(userId, deviceId),
    );
    if (hardware) await AuthCache.hardware.remember(userId, deviceId, hardware);
    return hardware;
  }

  async #firstNonNull<T>(
    a: Promise<T | null>,
    b: Promise<T | null>,
  ): Promise<T | null> {
    const [first, second] = await Promise.all([a, b]);
    return first ?? second;
  }

  async #forceSignOut(): Promise<void> {
    const token = request.token();
    if (!token) return;

    await AccountRevocation.session(token);
  }
}
