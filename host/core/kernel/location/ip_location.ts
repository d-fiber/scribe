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
import { Valkery } from "@scribe/core/runtime/redis/cache/valkery.ts";
import { isPrivateIp } from "@scribe/core/runtime/http/ip/mod.ts";
import type { GeolocationProvider, RequestIpLocation } from "./provider.ts";
import { DbIpProvider } from "./providers/db_ip_provider.ts";
import { FreeIpApiProvider } from "./providers/free_ip_api_provider.ts";
import { IpInfoProvider } from "./providers/ip_info_provider.ts";
import { IpWhoProvider } from "./providers/ip_who_provider.ts";
import { installLocationResolver } from "@scribe/core/runtime/http/accessors/location.ts";

export type { RequestIpLocation };

const _TIMEOUT_MS = 3_000;
const _EMPTY_LOCATION: RequestIpLocation = { city: "", country: "" };

class _IpGeoCache extends Valkery {
  override get key(): string {
    return "ip:geo";
  }
  override get ttl(): Time {
    return Time.days(1);
  }
}

export class GeolocationResolver {
  private static readonly _cache = new _IpGeoCache();

  private static readonly _providers: readonly GeolocationProvider[] = [
    new IpWhoProvider(),
    new FreeIpApiProvider(),
    new DbIpProvider(),
    new IpInfoProvider(),
  ];

  static locate(ip: string): Promise<RequestIpLocation> {
    if (!ip || isPrivateIp(ip)) return Promise.resolve(_EMPTY_LOCATION);
    return this._cache.upsert(ip, () => this._resolveViaProviders(ip));
  }

  private static async _resolveViaProviders(
    ip: string,
  ): Promise<RequestIpLocation> {
    for (const provider of this._providers) {
      const location = await this._tryProvider(provider, ip);
      if (location) return location;
    }
    return _EMPTY_LOCATION;
  }

  private static async _tryProvider(
    provider: GeolocationProvider,
    ip: string,
  ): Promise<RequestIpLocation | null> {
    try {
      const url = provider.buildUrl(ip);
      if (!url.startsWith("https://")) {
        console.error(`[geolocation] fournisseur non-HTTPS ignoré : ${url}`);
        return null;
      }

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(_TIMEOUT_MS),
      });
      if (!res.ok) return null;

      const data = await res.json();
      return provider.parse(data);
    } catch {
      return null;
    }
  }
}

export function ipLocation(ip: string): Promise<RequestIpLocation> {
  return GeolocationResolver.locate(ip);
}

installLocationResolver(ipLocation);
