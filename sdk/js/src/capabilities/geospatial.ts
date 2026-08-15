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

import { Geospatial } from "../../gen/scribe/host/dependencies/geospatial/protocol/geospatial_pb.ts";
import { host } from "./channel.ts";
import { raiseOn } from "./error.ts";

const CAPABILITY = "geospatial";

export interface Coordinates {
  readonly lat: number;
  readonly lng: number;
}

export interface PostalAddress {
  readonly street: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface GeocodedPlace {
  readonly coordinates: Coordinates;
  readonly address: PostalAddress;
}

function addressOf(address: {
  street: string;
  city: string;
  postalCode: string;
  country: string;
} | undefined): PostalAddress {
  return {
    street: address?.street ?? "",
    city: address?.city ?? "",
    postalCode: address?.postalCode ?? "",
    country: address?.country ?? "",
  };
}

export const geospatial = {
  async geocode(query: string, region = ""): Promise<GeocodedPlace> {
    const result = await host.client().call(Geospatial.method.geocode, { query, region });
    raiseOn(CAPABILITY, result.error);
    return {
      coordinates: {
        lat: result.coordinates?.lat ?? 0,
        lng: result.coordinates?.lng ?? 0,
      },
      address: addressOf(result.address),
    };
  },

  async reverseGeocode(coordinates: Coordinates): Promise<PostalAddress> {
    const result = await host.client().call(Geospatial.method.reverseGeocode, { coordinates });
    raiseOn(CAPABILITY, result.error);
    return addressOf(result.address);
  },
};
