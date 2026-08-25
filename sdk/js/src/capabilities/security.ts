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

import {
  type Account as ProtoAccount,
  Auth,
} from "../../gen/scribe/engine/dependencies/security/auth/protocol/auth_pb.ts";
import { Rbac } from "../../gen/scribe/engine/dependencies/security/rbac/protocol/rbac_pb.ts";
import { type Vpn as ProtoVpn, VpnAdmin } from "../../gen/scribe/engine/dependencies/security/vpn/protocol/vpn_pb.ts";
import { decodeJson, encodeJson } from "../contracts/json.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

export interface Account {
  readonly id: string;
  readonly email: string;
  readonly phone: string;
  readonly emailConfirmed: boolean;
  readonly phoneConfirmed: boolean;
  readonly appMetadata: unknown;
  readonly userMetadata: unknown;
  readonly createdAt: number;
}

export interface SessionSummary {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: number;
  readonly expiresAt: number;
}

export interface AccountUpdate {
  readonly email?: string;
  readonly phone?: string;
  readonly userMetadata?: unknown;
}

export interface VpnPeer {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly createdAt: number;
  readonly lastHandshakeAt: number;
}

function accountOf(account: ProtoAccount | undefined): Account | null {
  if (!account) return null;
  return {
    id: account.id,
    email: account.email,
    phone: account.phone,
    emailConfirmed: account.emailConfirmed,
    phoneConfirmed: account.phoneConfirmed,
    appMetadata: decodeJson(account.appMetadata),
    userMetadata: decodeJson(account.userMetadata),
    createdAt: Number(account.createdAt),
  };
}

function peerOf(vpn: ProtoVpn): VpnPeer {
  return {
    id: vpn.id,
    name: vpn.name,
    enabled: vpn.enabled,
    createdAt: Number(vpn.createdAt),
    lastHandshakeAt: Number(vpn.lastHandshakeAt),
  };
}

export const auth = {
  async account(userId: string, email = ""): Promise<Account | null> {
    const result = await host.client().call(Auth.method.getAccount, { userId, email });
    raiseOn("auth", result.error);
    return accountOf(result.account);
  },

  async updateAccount(userId: string, update: AccountUpdate): Promise<Account | null> {
    const result = await host.client().call(Auth.method.updateAccount, {
      userId,
      email: update.email ?? "",
      phone: update.phone ?? "",
      userMetadata: encodeJson(update.userMetadata ?? {}),
    });
    raiseOn("auth", result.error);
    return accountOf(result.account);
  },

  async deleteAccount(userId: string, soft = false): Promise<void> {
    const result = await host.client().call(Auth.method.deleteAccount, { userId, soft });
    raiseOn("auth", result.error);
  },

  async sessions(userId: string, sessionId = ""): Promise<readonly SessionSummary[]> {
    const result = await host.client().call(Auth.method.listSessions, { userId, sessionId });
    raiseOn("auth", result.error);
    return result.sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      createdAt: Number(session.createdAt),
      expiresAt: Number(session.expiresAt),
    }));
  },

  async signOut(userId: string, sessionId = "", global = false): Promise<void> {
    const result = await host.client().call(Auth.method.signOut, { userId, sessionId, global });
    raiseOn("auth", result.error);
  },

  async validate(input: {
    password?: string;
    email?: string;
    phone?: string;
  }): Promise<{ valid: boolean; violations: readonly string[] }> {
    const result = await host.client().call(Auth.method.validate, {
      password: input.password ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
    });
    return { valid: result.valid, violations: result.violations };
  },
};

export const rbac = {
  async rules(adminId: string): Promise<{ role: string; permissions: readonly string[] }> {
    const result = await host.client().call(Rbac.method.getRules, { adminId });
    raiseOn("rbac", result.error);
    return {
      role: result.rules?.role ?? "",
      permissions: result.rules?.permissions ?? [],
    };
  },

  async grants(
    adminId: string,
    permissions: readonly string[],
    requireAll = true,
  ): Promise<{ granted: boolean; missing: readonly string[] }> {
    const result = await host.client().call(Rbac.method.hasPermission, {
      adminId,
      permissions: [...permissions],
      requireAll,
    });
    return { granted: result.granted, missing: result.missing };
  },
};

export const vpn = {
  async get(vpnId: string): Promise<VpnPeer | null> {
    const result = await host.client().call(VpnAdmin.method.get, { vpnId });
    raiseOn("vpn", result.error);
    return result.vpn ? peerOf(result.vpn) : null;
  },

  async getByOwner(name: string): Promise<VpnPeer | null> {
    const result = await host.client().call(VpnAdmin.method.getByOwner, { name });
    raiseOn("vpn", result.error);
    return result.vpn ? peerOf(result.vpn) : null;
  },

  async create(name: string): Promise<VpnPeer | null> {
    const result = await host.client().call(VpnAdmin.method.create, { name });
    raiseOn("vpn", result.error);
    return result.vpn ? peerOf(result.vpn) : null;
  },

  async delete(vpnId: string): Promise<void> {
    raiseOn("vpn", (await host.client().call(VpnAdmin.method.delete, { vpnId })).error);
  },

  async deleteAll(name: string): Promise<void> {
    raiseOn("vpn", (await host.client().call(VpnAdmin.method.deleteAll, { name })).error);
  },

  async enable(vpnId: string): Promise<void> {
    raiseOn("vpn", (await host.client().call(VpnAdmin.method.enable, { vpnId })).error);
  },

  async disable(vpnId: string): Promise<void> {
    raiseOn("vpn", (await host.client().call(VpnAdmin.method.disable, { vpnId })).error);
  },

  async disableAll(name: string): Promise<void> {
    raiseOn("vpn", (await host.client().call(VpnAdmin.method.disableAll, { name })).error);
  },

  async rename(vpnId: string, name: string): Promise<void> {
    raiseOn("vpn", (await host.client().call(VpnAdmin.method.rename, { vpnId, name })).error);
  },

  async pagination(
    offset: number,
    size: number,
  ): Promise<{ vpns: readonly VpnPeer[]; total: number }> {
    const result = await host.client().call(VpnAdmin.method.pagination, { offset, size });
    raiseOn("vpn", result.error);
    return { vpns: result.vpns.map(peerOf), total: Number(result.total) };
  },

  async configuration(vpnId: string): Promise<string> {
    const result = await host.client().call(VpnAdmin.method.configuration, { vpnId });
    raiseOn("vpn", result.error);
    return result.configuration;
  },

  async qrcode(vpnId: string): Promise<string> {
    const result = await host.client().call(VpnAdmin.method.qrcode, { vpnId });
    raiseOn("vpn", result.error);
    return result.qrcode;
  },
};
