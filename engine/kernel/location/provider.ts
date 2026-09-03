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

import type { IpLocation } from "@scribe/alchemy/route";

export type { IpLocation };

/**
 * One HTTP geolocation lookup service: how to ask it, and how to read what it answers.
 *
 * @remarks
 * `GeolocationResolver` calls four of these in turn, one free service after another, because none
 * of them is reliable enough on its own to be the only one: an outage or a rate limit on one
 * provider still leaves the caller's location to the next. Splitting the interface into `buildUrl`
 * and `parse` is what lets `GeolocationResolver` treat every provider the same way, request a URL,
 * fetch it, hand the body to `parse`, without knowing that provider's own response shape.
 */
export interface GeolocationProvider {
  /** The URL that asks this provider for `ip`'s location. */
  buildUrl(ip: string): string;

  /** The location `data`, this provider's own response body already parsed as JSON, resolves to. */
  parse(data: unknown): IpLocation | null;
}

/**
 * What every {@link GeolocationProvider} shares.
 *
 * @remarks
 * Every provider answers a city and a country from its own differently-named fields, so `field`
 * and `location` exist to be that one piece of shared logic once rather than four times over: the
 * only thing a concrete provider adds is which field names to read and which URL to build.
 */
export abstract class AbstractGeolocationProvider implements GeolocationProvider {
  /** The {@link GeolocationProvider.buildUrl} contract, left to each concrete provider. */
  abstract buildUrl(ip: string): string;

  /** The {@link GeolocationProvider.parse} contract, left to each concrete provider. */
  abstract parse(data: unknown): IpLocation | null;

  /**
   * The trimmed string at `key` in `data`, or an empty string when `data` carries none.
   *
   * @remarks
   * An empty string rather than `null` or throwing, because {@link location} already treats an
   * empty city or country as absent: a provider whose response is missing a field or is not the
   * shape expected reads the same way as one that simply answered nothing for that field.
   */
  protected field(data: unknown, key: string): string {
    if (data === null || typeof data !== "object") return "";
    const value = (data as Record<string, unknown>)[key];
    return typeof value === "string" ? value.trim() : "";
  }

  /**
   * An {@link IpLocation} from `city` and `country`, or `null` when both are empty.
   *
   * @remarks
   * `null` is what tells `GeolocationResolver` a provider answered nothing usable, worth moving on
   * to the next one for, apart from a provider that genuinely has only a city or only a country:
   * either alone is still a location worth keeping, so only both together being empty counts as a
   * miss. The bounds on `city` and `country` guard against a provider that changed its response
   * shape and started handing back something that is not a place name at all.
   */
  protected location(city: string, country: string): IpLocation | null {
    if (!city && !country) return null;
    return { city: city.slice(0, 100), country: country.slice(0, 2) };
  }
}
