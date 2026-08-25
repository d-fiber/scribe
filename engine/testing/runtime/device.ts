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

import "@scribe/testing/settings.ts";
import type { RequestDevice } from "@scribe/contracts/device.ts";
import { ClientType, DeviceCategory, DeviceOs, DeviceThemeMode, Localization } from "@scribe/contracts/enums.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";

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
