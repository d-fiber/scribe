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
import { fakeDevice } from "../runtime/device.ts";

const _DEVICE_CACHE_KEY = "device:resolved";

export interface ApiCallOptions {
  readonly device?: RequestDevice | null;
  readonly headers?: Record<string, string>;
  readonly method?: string;
  readonly path?: string;
  readonly identity?: RequestUser;
  readonly token?: string;
}

export interface ApiCallResult {
  readonly status: number;
  readonly body: Record<string, unknown>;
}

export function callEndpoint(
  handler: () => Promise<Response>,
  body: unknown = {},
  options: ApiCallOptions = {},
): Promise<ApiCallResult> {
  const {
    device = fakeDevice(),
    headers = {},
    method = "POST",
    path = "/",
    identity,
    token = "access-token",
  } = options;

  const encoded = new TextEncoder().encode(JSON.stringify(body));
  const request = new Request(`http://api.test${path}`, {
    method,
    headers: {
      "x-real-ip": "1.2.3.4",
      "content-type": "application/json",
      ...(identity ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: method === "GET" || method === "HEAD" ? undefined : encoded,
  });

  return RequestScope.run(request, encoded, async () => {
    RequestScope.cache.set(_DEVICE_CACHE_KEY, Promise.resolve(device));
    if (identity) {
      await RequestIdentityCache.remember(() => Promise.resolve(identity));
    }
    const response = await handler();
    return {
      status: response.status,
      body: await _json(response),
    };
  }, "127.0.0.1");
}

async function _json(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { _raw: text };
  }
}
