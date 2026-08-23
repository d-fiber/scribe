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

import type { PageRequest } from "@scribe/alchemy";
import { Duration } from "@scribe/alchemy";
import { currentClient } from "@scribe/foundation/lib/src/http/run_with_client.ts";
import type { HttpResponse } from "@scribe/alchemy/http";
import { Pagination } from "@scribe/alchemy";
import type { Result } from "@scribe/alchemy";
import { Failure, Ok, okay } from "@scribe/alchemy";
import { Env } from "@scribe/host/env.ts";
import { Valkery } from "@scribe/foundation/lib/src/valkery/valkery.ts";

export interface Vpn {
  id: string;
  name: string;
  enabled: boolean;
  address: string;
  publicKey: string;
  createdAt: string;
  updatedAt: string;
  latestHandshakeAt: string | null;
  transferRx: number;
  transferTx: number;
  persistentKeepalive: string;
  allowedIPs: string[];
}

export enum VpnError {
  NotFound = "not_found",
  Unexpected = "unexpected",
}

const _TIMEOUT: Duration = Duration.seconds(5);
const _SESSION_TTL = 3_600;
const _DEFAULT_PAGE_SIZE = 30;

class _VpnSession {
  readonly #cache = new Valkery<string>({ key: "vpn:session", ttl: Duration.seconds(_SESSION_TTL) });

  constructor(
    private readonly baseUrl: string,
    private readonly password: string,
  ) {}

  cookie(): Promise<string> {
    return this.#cache.upsert("cookie", () => this.#login());
  }

  invalidate(): Promise<void> {
    return this.#cache.delete("cookie");
  }

  headers(
    cookie: string,
    extra?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = extra ?? {};
    if (cookie) headers["Cookie"] = cookie;
    return headers;
  }

  async #login(): Promise<string> {
    if (!this.password) {
      throw new Error(
        "WG_EASY_PASSWORD is empty: refusing to reach the VPN admin API unauthenticated",
      );
    }

    const client = currentClient();
    let res: HttpResponse;
    try {
      res = await client.post(`${this.baseUrl}/api/session`, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: this.password }),
        timeout: _TIMEOUT,
      });
    } finally {
      client.close();
    }

    if (!res.ok) {
      throw new Error(`wg-easy login failed: ${res.statusCode} - ${res.body}`);
    }
    return res.headers.get("set-cookie")?.split(";")[0] ?? "";
  }
}

/** What a call to wg-easy carries. */
interface WgRequest {
  readonly method?: "GET" | "POST" | "PUT" | "DELETE";
  readonly headers?: Record<string, string>;
  readonly body?: string;
}

export interface AdminVpnService {
  get(vpnId: string): Promise<Result<Vpn, VpnError>>;
  getByOwner(name: string): Promise<Result<Vpn, VpnError>>;
  disableAll(name: string): Promise<Result<void, VpnError>>;
  pagination(
    options?: PageRequest,
  ): Promise<Result<Pagination<Vpn>, VpnError>>;
  create(name: string): Promise<Result<Vpn, VpnError>>;
  delete(vpnId: string): Promise<Result<void, VpnError>>;
  deleteAll(name: string): Promise<Result<void, VpnError>>;
  enable(vpnId: string): Promise<Result<void, VpnError>>;
  disable(vpnId: string): Promise<Result<void, VpnError>>;
  rename(vpnId: string, name: string): Promise<Result<void, VpnError>>;
  configuration(vpnId: string): Promise<Result<string, VpnError>>;
  qrcode(vpnId: string): Promise<Result<string, VpnError>>;
}

export class AdminVpnClient implements AdminVpnService {
  readonly #session = new _VpnSession(Env.WG_EASY_URL, Env.WG_EASY_PASSWORD);
  readonly #cache = new Valkery<Vpn[]>({ key: "vpn:list", ttl: Duration.hours(24) });

  async get(vpnId: string): Promise<Result<Vpn, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const client = list.data.find((c) => c.id === vpnId);
    if (!client) return new Failure(VpnError.NotFound);
    return new Ok(client);
  }

  async getByOwner(name: string): Promise<Result<Vpn, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const owned = list.data
      .filter((c) => c.name === name)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (owned.length === 0) return new Failure(VpnError.NotFound);
    return new Ok(owned[0]);
  }

  async disableAll(name: string): Promise<Result<void, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    for (const client of list.data.filter((c) => c.name === name)) {
      const res = await this.disable(client.id);
      if (!res.ok && res.error !== VpnError.NotFound) {
        return new Failure(VpnError.Unexpected);
      }
    }
    return okay;
  }

  async pagination(
    options?: PageRequest,
  ): Promise<Result<Pagination<Vpn>, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const offset = options?.offset ?? 0;
    const size = options?.size ?? _DEFAULT_PAGE_SIZE;
    return new Ok(Pagination.of(list.data.slice(offset), offset, size));
  }

  async create(name: string): Promise<Result<Vpn, VpnError>> {
    const before = await this.#list();
    const known = new Set(before.ok ? before.data.map((c) => c.id) : []);

    const res = await this.#fetch("/api/wireguard/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return new Failure(VpnError.Unexpected);

    await this.#invalidateList();
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const created = list.data.filter(
      (c) => c.name === name && !known.has(c.id),
    );
    if (created.length !== 1) return new Failure(VpnError.NotFound);
    return new Ok(created[0]);
  }

  async delete(vpnId: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}`,
      {
        method: "DELETE",
      },
    );
    if (res.statusCode === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return okay;
  }

  async deleteAll(name: string): Promise<Result<void, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    for (const client of list.data.filter((c) => c.name === name)) {
      const res = await this.delete(client.id);
      if (!res.ok && res.error !== VpnError.NotFound) {
        return new Failure(VpnError.Unexpected);
      }
    }
    return okay;
  }

  async enable(vpnId: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/enable`,
      {
        method: "POST",
      },
    );
    if (res.statusCode === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return okay;
  }

  async disable(vpnId: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/disable`,
      {
        method: "POST",
      },
    );
    if (res.statusCode === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return okay;
  }

  async rename(vpnId: string, name: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/name`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );
    if (res.statusCode === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return okay;
  }

  async configuration(vpnId: string): Promise<Result<string, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/configuration`,
    );
    if (res.statusCode === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    return new Ok(res.body);
  }

  async qrcode(vpnId: string): Promise<Result<string, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/qrcode.svg`,
    );
    if (res.statusCode === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    return new Ok(res.body);
  }

  async #list(): Promise<Result<Vpn[], void>> {
    try {
      const data = await this.#cache.upsert("all", async () => {
        const res = await this.#fetch("/api/wireguard/client");
        if (!res.ok) throw new Error(`wg-easy list failed: ${res.statusCode}`);
        return res.json<Vpn[]>();
      });
      return new Ok(data);
    } catch {
      return new Failure(undefined);
    }
  }

  #invalidateList(): Promise<void> {
    return this.#cache.delete("all");
  }

  // wg-easy expires a session cookie without warning, so a 401 is answered by taking a fresh
  // cookie and sending once more. Only once: a second 401 is a password that no longer works.
  async #fetch(path: string, init: WgRequest = {}): Promise<HttpResponse> {
    const attempt = async (cookie: string): Promise<HttpResponse> => {
      const client = currentClient();
      const url = `${Env.WG_EASY_URL}${path}`;
      const options = {
        headers: this.#session.headers(cookie, init.headers),
        body: init.body ?? null,
        timeout: _TIMEOUT,
      };

      try {
        switch (init.method) {
          case "POST":
            return await client.post(url, options);
          case "PUT":
            return await client.put(url, options);
          case "DELETE":
            return await client.delete(url, options);
          default:
            return await client.get(url, options);
        }
      } finally {
        client.close();
      }
    };

    const res = await attempt(await this.#session.cookie());
    if (res.statusCode !== 401) return res;

    await this.#session.invalidate();
    return attempt(await this.#session.cookie());
  }
}

export const vpn: AdminVpnService = new AdminVpnClient();
