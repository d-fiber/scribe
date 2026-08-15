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

import { assertEquals } from "@std/assert";
import { createGeocoderMock } from "@scribe/host/tests/mocks/dependencies/geospatial/geocoder.ts";

Deno.test("geocoder automock: when() configures geocode", async () => {
  const mock = createGeocoderMock();
  mock.when("geocode", () => Promise.resolve({ lat: 1, lng: 2 }));

  const result = await mock.target.geocode({
    street: "a",
    city: "b",
    postal_code: "c",
    country: "d",
  });

  assertEquals(result, { lat: 1, lng: 2 });
});

Deno.test(
  "geocoder automock: when() configures a synchronous method too",
  () => {
    const mock = createGeocoderMock();
    mock.when(
      "isValidCoordinates",
      (lat: number, lng: number) => lat === 1 && lng === 2,
    );

    assertEquals(mock.target.isValidCoordinates(1, 2), true);
    assertEquals(mock.target.isValidCoordinates(999, 2), false);
  },
);
