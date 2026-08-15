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
import { RequestIdentityCache, type RequestUser } from "@scribe/core/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

const _DEVICE_CACHE_KEY = "device:resolved";

export interface SignedInOptions {
  readonly identity: RequestUser;
  readonly token?: string;
  readonly device?: RequestDevice | null;
  readonly headers?: Record<string, string>;
}

export function withSignedIn<T>(
  { identity, token = "access-token", device = null, headers = {} }: SignedInOptions,
  body: () => Promise<T>,
): Promise<T> {
  const request = new Request("http://api.test/", {
    headers: {
      "x-real-ip": "1.2.3.4",
      authorization: `Bearer ${token}`,
      ...headers,
    },
  });

  return RequestScope.run(request, new Uint8Array(0), async () => {
    RequestScope.cache.set(_DEVICE_CACHE_KEY, Promise.resolve(device));
    await RequestIdentityCache.remember(() => Promise.resolve(identity));
    return await body();
  }, "127.0.0.1");
}
