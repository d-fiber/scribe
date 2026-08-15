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

import "@scribe/core/testing/settings.ts";
import type { RequestDevice } from "@scribe/core/contracts/device.ts";
import { ClientType, DeviceCategory, DeviceOs, DeviceThemeMode, Localization } from "@scribe/core/contracts/enums.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

const _DEVICE_CACHE_KEY = "device:resolved";

export function fakeDevice(
  overrides: Partial<RequestDevice> = {},
): RequestDevice {
  return {
    device_id: "device-1",
    client: ClientType.APP,
    os: DeviceOs.IOS,
    model: "iPhone15,2",
    is_physical_device: true,
    device_category: DeviceCategory.PHONE,
    localization: Localization.FRENCH,
    theme_mode: DeviceThemeMode.SYSTEM,
    binding: "",
    iat: 0,
    ...overrides,
  };
}

export function requestWith(
  headers: Record<string, string> = {},
): Request {
  return new Request("http://api.test/", {
    headers: { "x-real-ip": "1.2.3.4", ...headers },
  });
}

export function withRequest<T>(
  device: RequestDevice | null,
  body: () => Promise<T>,
  headers: Record<string, string> = {},
): Promise<T> {
  return RequestScope.run(requestWith(headers), new Uint8Array(0), () => {
    RequestScope.cache.set(_DEVICE_CACHE_KEY, Promise.resolve(device));
    return body();
  }, "127.0.0.1");
}
