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
