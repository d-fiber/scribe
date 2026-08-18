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

import { Env } from "@scribe/host/env.ts";
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

class _GeocodeCache extends Valkery {
  override get key(): string {
    return "geocode:fwd";
  }
  override get ttl(): Time {
    return CACHE_TTL;
  }
}

class _ReverseGeocodeCache extends Valkery {
  override get key(): string {
    return "geocode:rev";
  }
  override get ttl(): Time {
    return CACHE_TTL;
  }
}

const geocodeCache = new _GeocodeCache();
const reverseGeocodeCache = new _ReverseGeocodeCache();

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
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const data = await res.json();

      if (data.status !== "OK" || !data.results?.length) return null;
      return data.results as _GoogleGeocodingResult[];
    } catch {
      return null;
    }
  }
}

export const geocoder: GeocoderClient = new GeocoderClient();
