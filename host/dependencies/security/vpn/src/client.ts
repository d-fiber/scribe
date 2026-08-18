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

import { Time } from "@scribe/core/contracts/common/time.ts";
import type { Pagination } from "@scribe/core/contracts/pagination.ts";
import { pagination as paginate } from "@scribe/core/contracts/pagination.ts";
import type { Result } from "@scribe/core/contracts/result.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { Env } from "@scribe/host/env.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";

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

interface VpnPaginationOptions {
  readonly offset?: number;
  readonly size?: number;
}

const _TIMEOUT_MS = 5_000;
const _SESSION_TTL = 3_600;
const _DEFAULT_PAGE_SIZE = 30;

class _VpnSessionCache extends Valkery {
  override get key(): string {
    return "vpn:session";
  }
  override get ttl(): Time {
    return Time.seconds(_SESSION_TTL);
  }
}

class _VpnListCache extends Valkery {
  override get key(): string {
    return "vpn:list";
  }
  override get ttl(): Time {
    return Time.hours(24);
  }
}

class _VpnSession {
  readonly #cache = new _VpnSessionCache();

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

    const res = await fetch(`${this.baseUrl}/api/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: this.password }),
      signal: AbortSignal.timeout(_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`wg-easy login failed: ${res.status} - ${body}`);
    }
    return res.headers.get("set-cookie")?.split(";")[0] ?? "";
  }
}

export interface AdminVpnService {
  get(vpnId: string): Promise<Result<Vpn, VpnError>>;
  getByOwner(name: string): Promise<Result<Vpn, VpnError>>;
  disableAll(name: string): Promise<Result<void, VpnError>>;
  pagination(
    options?: VpnPaginationOptions,
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
  readonly #cache = new _VpnListCache();

  async get(vpnId: string): Promise<Result<Vpn, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const client = list.data.find((c) => c.id === vpnId);
    if (!client) return new Failure(VpnError.NotFound);
    return new OK(client);
  }

  async getByOwner(name: string): Promise<Result<Vpn, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const owned = list.data
      .filter((c) => c.name === name)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (owned.length === 0) return new Failure(VpnError.NotFound);
    return new OK(owned[0]);
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
    return new OK();
  }

  async pagination(
    options?: VpnPaginationOptions,
  ): Promise<Result<Pagination<Vpn>, VpnError>> {
    const list = await this.#list();
    if (!list.ok) return new Failure(VpnError.Unexpected);

    const offset = options?.offset ?? 0;
    const size = options?.size ?? _DEFAULT_PAGE_SIZE;
    return new OK(paginate(list.data.slice(offset), offset, size));
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
    return new OK(created[0]);
  }

  async delete(vpnId: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}`,
      {
        method: "DELETE",
      },
    );
    if (res.status === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return new OK();
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
    return new OK();
  }

  async enable(vpnId: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/enable`,
      {
        method: "POST",
      },
    );
    if (res.status === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return new OK();
  }

  async disable(vpnId: string): Promise<Result<void, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/disable`,
      {
        method: "POST",
      },
    );
    if (res.status === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return new OK();
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
    if (res.status === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    await this.#invalidateList();
    return new OK();
  }

  async configuration(vpnId: string): Promise<Result<string, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/configuration`,
    );
    if (res.status === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    return new OK(await res.text());
  }

  async qrcode(vpnId: string): Promise<Result<string, VpnError>> {
    const res = await this.#fetch(
      `/api/wireguard/client/${encodeURIComponent(vpnId)}/qrcode.svg`,
    );
    if (res.status === 404) return new Failure(VpnError.NotFound);
    if (!res.ok) return new Failure(VpnError.Unexpected);
    return new OK(await res.text());
  }

  async #list(): Promise<Result<Vpn[], void>> {
    try {
      const data = await this.#cache.upsert("all", async () => {
        const res = await this.#fetch("/api/wireguard/client");
        if (!res.ok) throw new Error(`wg-easy list failed: ${res.status}`);
        return (await res.json()) as Vpn[];
      });
      return new OK(data);
    } catch {
      return new Failure();
    }
  }

  #invalidateList(): Promise<void> {
    return this.#cache.delete("all");
  }

  async #fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const attempt = (cookie: string) =>
      fetch(`${Env.WG_EASY_URL}${path}`, {
        ...init,
        headers: this.#session.headers(
          cookie,
          init.headers as Record<string, string> | undefined,
        ),
        signal: AbortSignal.timeout(_TIMEOUT_MS),
      });

    const res = await attempt(await this.#session.cookie());
    if (res.status !== 401) return res;

    await this.#session.invalidate();
    return attempt(await this.#session.cookie());
  }
}

export const vpn: AdminVpnService = new AdminVpnClient();
