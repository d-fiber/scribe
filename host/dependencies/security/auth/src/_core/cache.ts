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

import type { AccountRole, AdminDevice, UserDevice } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { kv } from "@scribe/core/runtime/redis/mod.ts";
import { Valkery } from "@scribe/host/packages/foundation/cache/valkery.ts";

function deviceKey(userId: string, deviceId: string): string {
  return `${userId}:${deviceId}`;
}

const ROLE_TTL = Time.seconds(300);
const ROLE_INDEX_KEY = "user:role:index";
const EMAIL_ENTRY = "email:";
const PHONE_ENTRY = "phone:";

const SESSION_IDEM_TTL = Time.seconds(15);
const SESSION_IDEM_INDEX_KEY = "session:idem:index";
const REFRESH_ENTRY = "refresh:";
const RECOVER_ENTRY = "recover:";

const SMS_INTENT_TTL = Time.seconds(120);

export enum SmsIntent {
  ResetPassword = "reset-password",
  ChangePhone = "change-phone",
}

class _SmsIntentCache extends Valkery {
  override get key(): string {
    return "sms-intent";
  }
  override get ttl(): Time {
    return SMS_INTENT_TTL;
  }
}

class _SmsIntentStore {
  readonly #cache = new _SmsIntentCache();

  mark(phone: string, intent: SmsIntent): Promise<void> {
    return this.#cache.add(phone, intent);
  }

  async consume(phone: string): Promise<SmsIntent | null> {
    const intent = await this.#cache.get<SmsIntent>(phone);
    if (intent === null) return null;
    await this.#cache.delete(phone);
    return intent;
  }
}

class _RoleByEmailCache extends Valkery {
  override get key(): string {
    return "email:role";
  }
  override get ttl(): Time {
    return ROLE_TTL;
  }
}

class _RoleByPhoneCache extends Valkery {
  override get key(): string {
    return "phone:role";
  }
  override get ttl(): Time {
    return ROLE_TTL;
  }
}

class _RoleByIdCache extends Valkery {
  override get key(): string {
    return "user:role";
  }
  override get ttl(): Time {
    return ROLE_TTL;
  }
}

class _RoleCache {
  readonly #email = new _RoleByEmailCache();
  readonly #phone = new _RoleByPhoneCache();
  readonly #id = new _RoleByIdCache();

  getByEmail(email: string): Promise<AccountRole | null> {
    return this.#email.get<AccountRole>(email);
  }

  async setByEmail(
    userId: string,
    email: string,
    role: AccountRole,
  ): Promise<void> {
    await Promise.all([
      this.#email.add(email, role),
      this.#remember(userId, `${EMAIL_ENTRY}${email}`),
    ]);
  }

  getByPhone(phone: string): Promise<AccountRole | null> {
    return this.#phone.get<AccountRole>(phone);
  }

  async setByPhone(
    userId: string,
    phone: string,
    role: AccountRole,
  ): Promise<void> {
    await Promise.all([
      this.#phone.add(phone, role),
      this.#remember(userId, `${PHONE_ENTRY}${phone}`),
    ]);
  }

  getById(userId: string): Promise<AccountRole | null> {
    return this.#id.get<AccountRole>(userId);
  }

  setById(userId: string, role: AccountRole): Promise<void> {
    return this.#id.add(userId, role);
  }

  async invalidateId(userId: string): Promise<void> {
    const entries = await this.#indexed(userId);

    await Promise.all([
      this.#id.delete(userId),
      ...entries.map((entry) =>
        entry.startsWith(EMAIL_ENTRY)
          ? this.#email.delete(entry.slice(EMAIL_ENTRY.length))
          : this.#phone.delete(entry.slice(PHONE_ENTRY.length))
      ),
    ]);

    await this.#forget(userId);
  }

  #indexKey(userId: string): string {
    return `${ROLE_INDEX_KEY}:${userId}`;
  }

  async #remember(userId: string, entry: string): Promise<void> {
    try {
      const key = this.#indexKey(userId);
      await kv().sadd(key, entry);
      await kv().expire(key, ROLE_TTL.value);
    } catch (e) {
      console.error("[auth-cache:role] index failed:", e);
    }
  }

  async #indexed(userId: string): Promise<string[]> {
    try {
      return await kv().smembers(this.#indexKey(userId));
    } catch (e) {
      console.error("[auth-cache:role] index read failed:", e);
      return [];
    }
  }

  async #forget(userId: string): Promise<void> {
    try {
      await kv().del(this.#indexKey(userId));
    } catch (e) {
      console.error("[auth-cache:role] index clear failed:", e);
    }
  }
}

class _DevicesNamespace extends Valkery {
  override get key(): string {
    return "session:devices";
  }
  override get ttl(): Time {
    return Time.seconds(300);
  }
}

class _DevicesCache {
  readonly #cache = new _DevicesNamespace();

  list(userId: string): Promise<UserDevice[] | AdminDevice[] | null> {
    return this.#cache.get<UserDevice[] | AdminDevice[]>(userId);
  }

  remember(
    userId: string,
    devices: UserDevice[] | AdminDevice[],
  ): Promise<void> {
    return this.#cache.add(userId, devices);
  }

  invalidate(userId: string): Promise<void> {
    return this.#cache.delete(userId);
  }
}

class _DeviceNamespace extends Valkery {
  override get key(): string {
    return "session:device";
  }
  override get ttl(): Time {
    return Time.seconds(300);
  }
}

class _DeviceCache {
  readonly #cache = new _DeviceNamespace();

  get(
    userId: string,
    deviceId: string,
  ): Promise<UserDevice | AdminDevice | null> {
    return this.#cache.get<UserDevice | AdminDevice>(
      deviceKey(userId, deviceId),
    );
  }

  remember(
    userId: string,
    deviceId: string,
    device: UserDevice | AdminDevice,
  ): Promise<void> {
    return this.#cache.add(deviceKey(userId, deviceId), device);
  }

  invalidate(userId: string, deviceId: string): Promise<void> {
    return this.#cache.delete(deviceKey(userId, deviceId));
  }

  invalidateAll(userId: string): Promise<void> {
    return this.#cache.clear(`${userId}:*`);
  }
}

class _HardwareNamespace extends Valkery {
  override get key(): string {
    return "device:hw";
  }
  override get ttl(): Time {
    return Time.seconds(300);
  }
}

class _HardwareCache {
  readonly #cache = new _HardwareNamespace();

  get<T>(userId: string, deviceId: string): Promise<T | null> {
    return this.#cache.get<T>(deviceKey(userId, deviceId));
  }

  remember<T>(userId: string, deviceId: string, hardware: T): Promise<void> {
    return this.#cache.add(deviceKey(userId, deviceId), hardware);
  }

  invalidate(userId: string, deviceId: string): Promise<void> {
    return this.#cache.delete(deviceKey(userId, deviceId));
  }

  invalidateAll(userId: string): Promise<void> {
    return this.#cache.clear(`${userId}:*`);
  }
}

class _RefreshIdemCache extends Valkery {
  override get key(): string {
    return "refresh-idem";
  }
  override get ttl(): Time {
    return SESSION_IDEM_TTL;
  }
}

class _RecoverIdemCache extends Valkery {
  override get key(): string {
    return "recover-idem";
  }
  override get ttl(): Time {
    return SESSION_IDEM_TTL;
  }
}

class _SessionIdemCache {
  readonly #refresh = new _RefreshIdemCache();
  readonly #recover = new _RecoverIdemCache();

  refreshed<T>(key: string): Promise<T | null> {
    return this.#refresh.get<T>(key);
  }

  async rememberRefreshed<T>(
    userId: string,
    key: string,
    value: T,
  ): Promise<void> {
    await Promise.all([
      this.#refresh.add(key, value),
      this.#remember(userId, `${REFRESH_ENTRY}${key}`),
    ]);
  }

  recovered<T>(key: string): Promise<T | null> {
    return this.#recover.get<T>(key);
  }

  async rememberRecovered<T>(
    userId: string,
    key: string,
    value: T,
  ): Promise<void> {
    await Promise.all([
      this.#recover.add(key, value),
      this.#remember(userId, `${RECOVER_ENTRY}${key}`),
    ]);
  }

  async invalidate(userId: string): Promise<void> {
    const entries = await this.#indexed(userId);

    await Promise.all(
      entries.map((entry) =>
        entry.startsWith(REFRESH_ENTRY)
          ? this.#refresh.delete(entry.slice(REFRESH_ENTRY.length))
          : this.#recover.delete(entry.slice(RECOVER_ENTRY.length))
      ),
    );

    await this.#forget(userId);
  }

  #indexKey(userId: string): string {
    return `${SESSION_IDEM_INDEX_KEY}:${userId}`;
  }

  async #remember(userId: string, entry: string): Promise<void> {
    try {
      const key = this.#indexKey(userId);
      await kv().sadd(key, entry);
      await kv().expire(key, SESSION_IDEM_TTL.value);
    } catch (e) {
      console.error("[auth-cache:session] index failed:", e);
    }
  }

  async #indexed(userId: string): Promise<string[]> {
    try {
      return await kv().smembers(this.#indexKey(userId));
    } catch (e) {
      console.error("[auth-cache:session] index read failed:", e);
      return [];
    }
  }

  async #forget(userId: string): Promise<void> {
    try {
      await kv().del(this.#indexKey(userId));
    } catch (e) {
      console.error("[auth-cache:session] index clear failed:", e);
    }
  }
}

const INTRA_TTL = Time.seconds(60);
const INTRA_INDEX_KEY = "intra:auth:index";

class _IntraAuthNamespace extends Valkery {
  override get key(): string {
    return "intra:auth";
  }
  override get ttl(): Time {
    return INTRA_TTL;
  }
}

class _IntraAuthCache {
  readonly #cache = new _IntraAuthNamespace();

  get(fingerprint: string): Promise<string | null> {
    return this.#cache.get<string>(fingerprint);
  }

  async remember(fingerprint: string, adminId: string): Promise<void> {
    await Promise.all([
      this.#cache.add(fingerprint, adminId),
      this.#remember(adminId, fingerprint),
    ]);
  }

  async invalidate(adminId: string): Promise<void> {
    const entries = await this.#indexed(adminId);
    await Promise.all(entries.map((entry) => this.#cache.delete(entry)));
    await this.#forget(adminId);
  }

  #indexKey(adminId: string): string {
    return `${INTRA_INDEX_KEY}:${adminId}`;
  }

  async #remember(adminId: string, fingerprint: string): Promise<void> {
    try {
      const key = this.#indexKey(adminId);
      await kv().sadd(key, fingerprint);
      await kv().expire(key, INTRA_TTL.value);
    } catch (e) {
      console.error("[auth-cache:intra] index failed:", e);
    }
  }

  async #indexed(adminId: string): Promise<string[]> {
    try {
      return await kv().smembers(this.#indexKey(adminId));
    } catch (e) {
      console.error("[auth-cache:intra] index read failed:", e);
      return [];
    }
  }

  async #forget(adminId: string): Promise<void> {
    try {
      await kv().del(this.#indexKey(adminId));
    } catch (e) {
      console.error("[auth-cache:intra] index clear failed:", e);
    }
  }
}

export class AuthCache {
  static readonly role: _RoleCache = new _RoleCache();
  static readonly intra: _IntraAuthCache = new _IntraAuthCache();
  static readonly devices: _DevicesCache = new _DevicesCache();
  static readonly device: _DeviceCache = new _DeviceCache();
  static readonly hardware: _HardwareCache = new _HardwareCache();
  static readonly session: _SessionIdemCache = new _SessionIdemCache();
  static readonly smsIntent: _SmsIntentStore = new _SmsIntentStore();
}
