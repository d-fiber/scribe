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

import { rest } from "@scribe/host/packages/foundation/database/rest/rest.ts";
import { DeviceToken } from "@scribe/host/dependencies/security/auth/src/user/devices/_internal/token.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import type { Location } from "@scribe/core/contracts/common/location.ts";
import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import type { ClientType, DeviceCategory, DeviceOs } from "@scribe/core/contracts/enums.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { currentLocation } from "@scribe/core/runtime/http/accessors/location.ts";
import { request } from "@scribe/core/runtime/http/request.ts";

export interface DeviceHardwareResult {
  os: DeviceOs;
  model: string;
  is_physical_device: boolean;
  device_category: DeviceCategory;
}

export interface DeviceTrustResult {
  hash: string | null;
  trusted_at: number;
}

export interface DeviceInsertResult {
  token: string;
  device: RequestDevice;
}

export interface DeviceRefreshResult {
  token: string;
  hash: string;
}

export interface DeviceMetadata {
  ip: string;
  city: string;
  country: string;
  appVersion?: string;
}

interface DeviceResultBase {
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
  created_at: number;
  updated_at: number;
}

export interface UserDeviceResult extends DeviceResultBase {
  notification_token: string | null;
  location: Location | null;
}

export type AdminDeviceResult = DeviceResultBase;

export abstract class DeviceRepository {
  abstract readonly kind: AccountRole;

  abstract getId(userId: string, deviceId: string): Promise<string | null>;
  abstract refreshHash(
    userId: string,
    id: string,
  ): Promise<DeviceRefreshResult | null>;
  abstract insert(userId: string): Promise<DeviceInsertResult | null>;
  abstract refreshMetadata(
    userId: string,
    deviceId: string,
    metadata: DeviceMetadata,
  ): Promise<boolean>;
  abstract delete(userId: string, deviceId: string): Promise<boolean>;
  abstract hardware(
    userId: string,
    deviceId: string,
  ): Promise<DeviceHardwareResult | null>;
  abstract isTrusted(
    userId: string,
    deviceId: string,
  ): Promise<DeviceTrustResult | null>;
  abstract get(
    userId: string,
    deviceId: string,
  ): Promise<(UserDeviceResult | AdminDeviceResult) | null>;
  abstract getAll(
    userId: string,
  ): Promise<(UserDeviceResult | AdminDeviceResult)[]>;
}

class UserDeviceRepository extends DeviceRepository {
  readonly kind = AccountRole.User as const;

  private deviceTable() {
    return rest.internal_t__app_user_devices();
  }

  async getId(userId: string, deviceId: string): Promise<string | null> {
    const row = await this.deviceTable()
      .select((s) => ({ id: s.id }))
      .where((f) => [f.user_id.eq(userId), f.device_id.eq(deviceId)])
      .getOne();
    return row?.id ?? null;
  }

  async refreshHash(
    userId: string,
    id: string,
  ): Promise<DeviceRefreshResult | null> {
    const { token, hash } = await DeviceToken.generate();
    const ok = await this.deviceTable()
      .where((f) => [f.user_id.eq(userId), f.id.eq(id)])
      .update({ hash, trusted_at: Date.now() });
    if (!ok) return null;

    return { token, hash };
  }

  async insert(userId: string): Promise<DeviceInsertResult | null> {
    const device = await requestDevice();
    if (!device) return null;

    const { token, hash } = await DeviceToken.generate();
    const ip = request.ip();
    const { city, country } = await currentLocation();

    const ok = await this.deviceTable().insert({
      user_id: userId,
      device_id: device.device_id,
      client: device.client,
      hash,
      os: device.os,
      model: device.model,
      app_version: device.app_version ?? null,
      is_physical_device: device.is_physical_device,
      device_category: device.device_category,
      notification_token: device.notification_token ?? null,
      ip,
      city,
      country,
    });
    if (!ok) return null;

    return { token, device };
  }

  refreshMetadata(
    userId: string,
    deviceId: string,
    { ip, city, country, appVersion }: DeviceMetadata,
  ): Promise<boolean> {
    return this.deviceTable()
      .where((f) => [f.user_id.eq(userId), f.device_id.eq(deviceId)])
      .update({ ip, city, country, app_version: appVersion });
  }

  delete(userId: string, deviceId: string): Promise<boolean> {
    return this.deviceTable()
      .where((f) => [f.user_id.eq(userId), f.device_id.eq(deviceId)])
      .delete();
  }

  hardware(
    userId: string,
    deviceId: string,
  ): Promise<DeviceHardwareResult | null> {
    return this.deviceTable()
      .select((s) => ({
        os: s.os,
        model: s.model,
        is_physical_device: s.is_physical_device,
        device_category: s.device_category,
      }))
      .where((f) => [f.user_id.eq(userId), f.device_id.eq(deviceId)])
      .getOne();
  }

  isTrusted(
    userId: string,
    deviceId: string,
  ): Promise<DeviceTrustResult | null> {
    return this.deviceTable()
      .select((s) => ({ trusted_at: s.trusted_at, hash: s.hash }))
      .where((f) => [f.user_id.eq(userId), f.device_id.eq(deviceId)])
      .getOne();
  }

  get(userId: string, deviceId: string): Promise<UserDeviceResult | null> {
    return this.deviceTable()
      .select((s) => ({
        id: s.id,
        device_id: s.device_id,
        client: s.client,
        os: s.os,
        model: s.model,
        is_physical_device: s.is_physical_device,
        device_category: s.device_category,
        notification_token: s.notification_token,
        location: s.location,
        ip: s.ip,
        city: s.city,
        country: s.country,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))
      .where((f) => [f.user_id.eq(userId), f.device_id.eq(deviceId)])
      .getOne();
  }

  getAll(userId: string): Promise<UserDeviceResult[]> {
    return this.deviceTable()
      .select((s) => ({
        id: s.id,
        device_id: s.device_id,
        client: s.client,
        os: s.os,
        model: s.model,
        is_physical_device: s.is_physical_device,
        device_category: s.device_category,
        notification_token: s.notification_token,
        location: s.location,
        ip: s.ip,
        city: s.city,
        country: s.country,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))
      .where((f) => f.user_id.eq(userId))
      .get();
  }
}

class AdminDeviceRepository extends DeviceRepository {
  readonly kind = AccountRole.Admin as const;

  private deviceTable() {
    return rest.internal_t__admin_users_devices();
  }

  async getId(adminId: string, deviceId: string): Promise<string | null> {
    const row = await this.deviceTable()
      .select((s) => ({ id: s.id }))
      .where((f) => [f.admin_id.eq(adminId), f.device_id.eq(deviceId)])
      .getOne();
    return row?.id ?? null;
  }

  async refreshHash(
    adminId: string,
    id: string,
  ): Promise<DeviceRefreshResult | null> {
    const { token, hash } = await DeviceToken.generate();
    const ok = await this.deviceTable()
      .where((f) => [f.admin_id.eq(adminId), f.id.eq(id)])
      .update({ hash, trusted_at: Date.now() });
    if (!ok) return null;

    return { token, hash };
  }

  async insert(userId: string): Promise<DeviceInsertResult | null> {
    const device = await requestDevice();
    if (!device) return null;

    const { token, hash } = await DeviceToken.generate();
    const ip = request.ip();
    const { city, country } = await currentLocation();

    const ok = await this.deviceTable().insert({
      admin_id: userId,
      device_id: device.device_id,
      client: device.client,
      hash,
      os: device.os,
      model: device.model,
      app_version: device.app_version ?? null,
      is_physical_device: device.is_physical_device,
      device_category: device.device_category,
      ip,
      city,
      country,
    });
    if (!ok) return null;

    return { token, device };
  }

  refreshMetadata(
    adminId: string,
    deviceId: string,
    { ip, city, country }: DeviceMetadata,
  ): Promise<boolean> {
    return this.deviceTable()
      .where((f) => [f.admin_id.eq(adminId), f.device_id.eq(deviceId)])
      .update({ ip, city, country });
  }

  delete(adminId: string, deviceId: string): Promise<boolean> {
    return this.deviceTable()
      .where((f) => [f.admin_id.eq(adminId), f.device_id.eq(deviceId)])
      .delete();
  }

  hardware(
    adminId: string,
    deviceId: string,
  ): Promise<DeviceHardwareResult | null> {
    return this.deviceTable()
      .select((s) => ({
        os: s.os,
        model: s.model,
        is_physical_device: s.is_physical_device,
        device_category: s.device_category,
      }))
      .where((f) => [f.admin_id.eq(adminId), f.device_id.eq(deviceId)])
      .getOne();
  }

  isTrusted(
    adminId: string,
    deviceId: string,
  ): Promise<DeviceTrustResult | null> {
    return this.deviceTable()
      .select((s) => ({ trusted_at: s.trusted_at, hash: s.hash }))
      .where((f) => [f.admin_id.eq(adminId), f.device_id.eq(deviceId)])
      .getOne();
  }

  get(adminId: string, deviceId: string): Promise<AdminDeviceResult | null> {
    return this.deviceTable()
      .select((s) => ({
        id: s.id,
        device_id: s.device_id,
        client: s.client,
        os: s.os,
        model: s.model,
        is_physical_device: s.is_physical_device,
        device_category: s.device_category,
        ip: s.ip,
        city: s.city,
        country: s.country,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))
      .where((f) => [f.admin_id.eq(adminId), f.device_id.eq(deviceId)])
      .getOne();
  }

  getAll(adminId: string): Promise<AdminDeviceResult[]> {
    return this.deviceTable()
      .select((s) => ({
        id: s.id,
        device_id: s.device_id,
        client: s.client,
        os: s.os,
        model: s.model,
        is_physical_device: s.is_physical_device,
        device_category: s.device_category,
        ip: s.ip,
        city: s.city,
        country: s.country,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }))
      .where((f) => f.admin_id.eq(adminId))
      .get();
  }
}

export class DeviceRepositories {
  readonly user = new UserDeviceRepository();
  readonly admin = new AdminDeviceRepository();
}
