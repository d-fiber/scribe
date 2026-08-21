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

import { Env } from "@scribe/host/env.ts";
import { get } from "@scribe/foundation/src/http/mod.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";

const BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const TIMEOUT_MS = 5_000;
const CACHE_TTL = Time.days(30);

export interface GeoAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

const geocodeCache = new Valkery<GeoCoordinates | null>({ key: "geocode:fwd", ttl: CACHE_TTL });
const reverseGeocodeCache = new Valkery<GeoAddress | null>({ key: "geocode:rev", ttl: CACHE_TTL });

function geocodeKey(address: GeoAddress): string {
  return [address.street, address.postal_code, address.city, address.country]
    .map((s) => s.trim().toLowerCase())
    .join("|");
}

function reverseGeocodeKey(coordinates: GeoCoordinates): string {
  return `${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}`;
}

interface _GoogleAddressComponent {
  types: string[];
  long_name: string;
  short_name: string;
}

interface _GoogleGeocodingResult {
  geometry: { location: { lat: number; lng: number } };
  address_components: _GoogleAddressComponent[];
}

class GeocoderClient {
  isValidCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  distanceBetween(a: GeoCoordinates, b: GeoCoordinates): number {
    const R = 6_371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }

  geocode(address: GeoAddress): Promise<GeoCoordinates | null> {
    return geocodeCache.upsert(geocodeKey(address), () => this._forwardGeocode(address));
  }

  reverseGeocode(coordinates: GeoCoordinates): Promise<GeoAddress | null> {
    return reverseGeocodeCache.upsert(reverseGeocodeKey(coordinates), () => this._reverseGeocode(coordinates));
  }

  private async _forwardGeocode(
    address: GeoAddress,
  ): Promise<GeoCoordinates | null> {
    const query = `${address.street}, ${address.postal_code} ${address.city}, ${address.country}`;
    const results = await this._fetchGoogleGeocoding(
      `address=${encodeURIComponent(query)}`,
    );
    if (!results) return null;

    const { lat, lng } = results[0].geometry.location;
    return { lat, lng };
  }

  private async _reverseGeocode(
    coordinates: GeoCoordinates,
  ): Promise<GeoAddress | null> {
    const latlng = `${coordinates.lat},${coordinates.lng}`;
    const results = await this._fetchGoogleGeocoding(
      `latlng=${encodeURIComponent(latlng)}`,
    );
    if (!results) return null;

    const components = results[0].address_components;
    const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name ?? "";

    const street_number = components.find((c) => c.types.includes("street_number"))?.short_name ??
      "";
    const street = [street_number, get("route")].filter(Boolean).join(" ");

    return {
      street,
      city: get("locality") || get("postal_town"),
      postal_code: get("postal_code"),
      country: get("country"),
    };
  }

  private async _fetchGoogleGeocoding(
    queryParam: string,
  ): Promise<_GoogleGeocodingResult[] | null> {
    const url = `${BASE_URL}?${queryParam}&key=${Env.GEOCODING_API_KEY}`;

    try {
      const res = await get(url, { timeout: TIMEOUT_MS });
      const data = res.json<{ status?: string; results?: _GoogleGeocodingResult[] }>();

      if (data.status !== "OK" || !data.results?.length) return null;
      return data.results;
    } catch {
      return null;
    }
  }
}

export const geocoder: GeocoderClient = new GeocoderClient();
