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

import { Auth } from "../../gen/scribe/packages/auth/protocol/auth_pb.ts";
import { decodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { CapabilityError, raiseOn } from "./error.ts";

const CAPABILITY = "auth";

/** A ban standing over one account. */
export interface AccountBan {
  /** When it was laid, in milliseconds since the epoch. */
  readonly since: number;

  /** When it lifts by itself, in milliseconds since the epoch, null when nothing lifts it. */
  readonly until: number | null;

  /** Why it was laid, null when whoever laid it gave no reason. */
  readonly reason: string | null;
}

/** One account of one role, as a worker reads it back. */
export interface Account<T = Record<string, unknown>> {
  /** The identifier the identity provider issued. */
  readonly id: string;

  /** The name of the declaration this account belongs to. */
  readonly role: string;

  /** The address it signs in with, null when it came through another door. */
  readonly email: string | null;

  /** The number it signs in with, null when it came through another door. */
  readonly phone: string | null;

  /** Whether the address has been proven. */
  readonly emailVerified: boolean;

  /** Whether the number has been proven. */
  readonly phoneVerified: boolean;

  /** When the account was created, in milliseconds since the epoch. */
  readonly createdAt: number;

  /** The ban standing over it, null when none does. */
  readonly ban: AccountBan | null;

  /**
   * Whatever the project's own declaration reads on top of the identity above.
   *
   * Its shape is decided by that declaration and not by this contract, so a worker that wants it
   * typed passes the type it expects.
   */
  readonly folded: T;
}

/** One device an account has signed in from. */
export interface AccountDevice {
  /** The identifier of the record, which a kick names. */
  readonly id: string;

  /** The identifier the client reports for itself, unique per account. */
  readonly deviceId: string;

  /** Which kind of client it is. */
  readonly client: string;

  /** Which operating system it runs. */
  readonly os: string;

  /** The hardware model the client reports. */
  readonly model: string;

  /** The build of the application it runs, empty when the client sent none. */
  readonly appVersion: string;

  /** Whether it is a real device rather than a simulator. */
  readonly isPhysicalDevice: boolean;

  /** Which class of device it is, which decides what a session may do. */
  readonly deviceCategory: string;

  /** Whether a sign-in from it skips the code the engine would otherwise send. */
  readonly trusted: boolean;

  /** The address the last request came from. */
  readonly ip: string;

  /** The city that address resolved to, empty when nothing resolved it. */
  readonly city: string;

  /** The country that address resolved to, empty when nothing resolved it. */
  readonly country: string;

  /** When the device was first seen, in milliseconds since the epoch. */
  readonly createdAt: number;

  /** When it was last seen, in milliseconds since the epoch. */
  readonly seenAt: number;
}

/** One role the project declared. */
export interface AccountRole {
  /** The name the declaration goes by, which is what every call here takes. */
  readonly name: string;

  /** The doors an account of this role may be created through. */
  readonly channels: readonly string[];
}

/** The accounts a project declared, as a worker reaches them. */
export interface AuthCapability {
  /**
   * The account of `role` that answers to `accountId`, folds included.
   *
   * @throws {CapabilityError} When no such role was declared, when no such account exists, or
   * when the host refused the read.
   */
  account<T = Record<string, unknown>>(role: string, accountId: string): Promise<Account<T>>;

  /**
   * Erases the account of `role` that answers to `accountId`, and everything hanging off it.
   *
   * Erasing an account that is already gone goes through, so a worker retrying one has nothing
   * different to do.
   *
   * @throws {CapabilityError} When no such role was declared, or when the host refused the write.
   */
  forget(role: string, accountId: string): Promise<void>;

  /**
   * Shuts `accountId` out of `role` for `forMs` milliseconds, or until it is lifted when `forMs`
   * is left out.
   *
   * @throws {CapabilityError} When no such role was declared, when no such account exists, or
   * when the host refused the write.
   */
  ban(role: string, accountId: string, options?: { forMs?: number; reason?: string }): Promise<void>;

  /**
   * Lets `accountId` back into `role`.
   *
   * @throws {CapabilityError} When no such role was declared, when no ban stands over the
   * account, or when the host refused the write.
   */
  unban(role: string, accountId: string): Promise<void>;

  /**
   * Every ban standing over the accounts of `role` right now.
   *
   * A ban whose end has passed is not listed, even while its row is still there.
   *
   * @throws {CapabilityError} When no such role was declared, or when the host refused the read.
   */
  bans(role: string): Promise<readonly (AccountBan & { readonly accountId: string })[]>;

  /**
   * Every device `accountId` has signed in from, under `role`.
   *
   * @throws {CapabilityError} When no such role was declared, or when the host refused the read.
   */
  devices(role: string, accountId: string): Promise<readonly AccountDevice[]>;

  /**
   * Signs one device out and forgets its record, answering whether one matched.
   *
   * A false means the device was already gone, which is not a refusal.
   *
   * @throws {CapabilityError} When no such role was declared, or when the host refused the write.
   */
  kick(role: string, accountId: string, deviceId: string): Promise<boolean>;

  /**
   * Signs every device of `accountId` out, the one that asked included.
   *
   * @throws {CapabilityError} When no such role was declared, or when the host refused the write.
   */
  kickAll(role: string, accountId: string): Promise<void>;

  /**
   * Every role the project declared, and the doors each one may be created through.
   *
   * A host that never loaded the project's declarations answers an empty list rather than a
   * refusal, so a worker reading nothing here should suspect the host before the project.
   *
   * @remarks
   * This is the one call here that cannot refuse: the contract gives `RoleListResult` no failure
   * field, so a host that cannot read its declarations is indistinguishable from a project that
   * declared none.
   */
  roles(): Promise<readonly AccountRole[]>;
}

function banOf(ban: { since: bigint; until: bigint; reason: string } | undefined): AccountBan | null {
  if (!ban) return null;
  return {
    since: Number(ban.since),
    until: ban.until === 0n ? null : Number(ban.until),
    reason: ban.reason === "" ? null : ban.reason,
  };
}

export const auth: AuthCapability = {
  async account<T = Record<string, unknown>>(role: string, accountId: string): Promise<Account<T>> {
    const result = await host.client().call(Auth.method.getAccount, { role, accountId });
    raiseOn(CAPABILITY, result.error);

    const account = result.account;
    if (!account) {
      throw new CapabilityError(CAPABILITY, "auth_failed", "the host answered neither an account nor a reason");
    }

    return {
      id: account.id,
      role: account.role,
      email: account.email === "" ? null : account.email,
      phone: account.phone === "" ? null : account.phone,
      emailVerified: account.emailVerified,
      phoneVerified: account.phoneVerified,
      createdAt: Number(account.createdAt),
      ban: banOf(account.ban),
      folded: (decodeJson<T>(account.folded) ?? {}) as T,
    };
  },

  async forget(role: string, accountId: string): Promise<void> {
    const result = await host.client().call(Auth.method.deleteAccount, { role, accountId });
    raiseOn(CAPABILITY, result.error);
  },

  async ban(role: string, accountId: string, options: { forMs?: number; reason?: string } = {}): Promise<void> {
    const result = await host.client().call(Auth.method.ban, {
      role,
      accountId,
      forMs: BigInt(options.forMs ?? 0),
      reason: options.reason ?? "",
    });

    raiseOn(CAPABILITY, result.error);
  },

  async unban(role: string, accountId: string): Promise<void> {
    const result = await host.client().call(Auth.method.unban, { role, accountId });
    raiseOn(CAPABILITY, result.error);
  },

  async bans(role: string): Promise<readonly (AccountBan & { readonly accountId: string })[]> {
    const result = await host.client().call(Auth.method.listBans, { role });
    raiseOn(CAPABILITY, result.error);

    return result.bans.flatMap((listed) => {
      const ban = banOf(listed.ban);
      return ban ? [{ accountId: listed.accountId, ...ban }] : [];
    });
  },

  async devices(role: string, accountId: string): Promise<readonly AccountDevice[]> {
    const result = await host.client().call(Auth.method.listDevices, { role, accountId });
    raiseOn(CAPABILITY, result.error);

    return result.devices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      client: device.client,
      os: device.os,
      model: device.model,
      appVersion: device.appVersion,
      isPhysicalDevice: device.isPhysicalDevice,
      deviceCategory: device.deviceCategory,
      trusted: device.trusted,
      ip: device.ip,
      city: device.city,
      country: device.country,
      createdAt: Number(device.createdAt),
      seenAt: Number(device.seenAt),
    }));
  },

  async kick(role: string, accountId: string, deviceId: string): Promise<boolean> {
    const result = await host.client().call(Auth.method.kickDevice, { role, accountId, deviceId });
    raiseOn(CAPABILITY, result.error);
    return result.kicked;
  },

  async kickAll(role: string, accountId: string): Promise<void> {
    const result = await host.client().call(Auth.method.kickAllDevices, { role, accountId });
    raiseOn(CAPABILITY, result.error);
  },

  async roles(): Promise<readonly AccountRole[]> {
    const result = await host.client().call(Auth.method.listRoles, {});
    return result.roles.map((role) => ({ name: role.name, channels: role.channels }));
  },
};
