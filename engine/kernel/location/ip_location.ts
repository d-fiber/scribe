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

import { cache, Duration } from "@scribe/alchemy";
import type { Cache, Future } from "@scribe/alchemy";
import { http } from "@scribe/alchemy/http";
import { isPrivateIp } from "@scribe/runtime/http/ip/mod.ts";
import type { GeolocationProvider, IpLocation } from "./provider.ts";
import { DbIpProvider } from "./providers/db_ip_provider.ts";
import { FreeIpApiProvider } from "./providers/free_ip_api_provider.ts";
import { IpInfoProvider } from "./providers/ip_info_provider.ts";
import { IpWhoProvider } from "./providers/ip_who_provider.ts";
import { installLocationResolver } from "@scribe/runtime/http/accessors/location.ts";

export type { IpLocation };

const _TIMEOUT: Duration = Duration.seconds(3);
const _EMPTY_LOCATION: IpLocation = { city: "", country: "" };

/**
 * Locates an IP by trying each configured {@link GeolocationProvider} in turn.
 *
 * @remarks
 * Cached for a day, because a given IP resolves to the same city on every lookup and every
 * provider here is a free tier with its own rate limit: caching is what keeps a popular deployment
 * from burning through that limit on repeat callers instead of new ones.
 */
export class GeolocationResolver {
  private static readonly _cache: Cache<IpLocation> = cache<IpLocation>({ key: "ip:geo", ttl: Duration.days(1) });

  private static readonly _providers: readonly GeolocationProvider[] = [
    new IpWhoProvider(),
    new FreeIpApiProvider(),
    new DbIpProvider(),
    new IpInfoProvider(),
  ];

  /**
   * The location of `ip`, or an empty location for a private address or a provider that answers
   * nothing usable. Reads through the cache, and tries each provider until one answers.
   */
  static locate(ip: string): Future<IpLocation> {
    if (!ip || isPrivateIp(ip)) return Promise.resolve(_EMPTY_LOCATION);
    return this._cache.upsert(ip, () => this._resolveViaProviders(ip));
  }

  private static async _resolveViaProviders(
    ip: string,
  ): Future<IpLocation> {
    for (const provider of this._providers) {
      const location = await this._tryProvider(provider, ip);
      if (location) return location;
    }
    return _EMPTY_LOCATION;
  }

  private static async _tryProvider(
    provider: GeolocationProvider,
    ip: string,
  ): Future<IpLocation | null> {
    try {
      const url = provider.buildUrl(ip);
      if (!url.startsWith("https://")) {
        console.error(`[geolocation] ignoring non-HTTPS provider: ${url}`);
        return null;
      }

      const res = await http.get(url, {
        headers: { Accept: "application/json" },
        timeout: _TIMEOUT,
      });
      if (!res.ok) return null;

      return provider.parse(res.json());
    } catch {
      return null;
    }
  }
}

export function ipLocation(ip: string): Future<IpLocation> {
  return GeolocationResolver.locate(ip);
}

installLocationResolver(ipLocation);
