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

import type { Future } from "@scribe/alchemy";
import "@scribe/testing/settings.ts";
import type { RequestDevice } from "@scribe/contracts/device.ts";
import type { RequestUser } from "@scribe/alchemy/route";
import { RequestIdentityCache } from "@scribe/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { fakeDevice } from "../runtime/device.ts";

const _DEVICE_CACHE_KEY = "device:resolved";

/**
 * What `callEndpoint` sends: the request's shape, plus the identity and device it is made as.
 *
 * @remarks
 * A device is filled with `fakeDevice()` by default rather than left out, because a test endpoint
 * that calls `ctx.device()` would otherwise fail on a case that never meant to exercise the device
 * path at all: a case that cares tests it explicitly by passing `device: null` or a payload of its
 * own.
 */
export interface ApiCallOptions {
  /** The device payload the call carries, or `null` for none; defaults to `fakeDevice()` when omitted. */
  readonly device?: RequestDevice | null;

  /** Extra headers merged onto the request, taking precedence over the ones this helper sets. */
  readonly headers?: Record<string, string>;

  /** The HTTP method the request is sent with. */
  readonly method?: string;

  /** The request path. */
  readonly path?: string;

  /** The identity the request is made as, or `null`/omitted for an anonymous call. */
  readonly identity?: RequestUser | null;

  /** The bearer token sent when `identity` is set. */
  readonly token?: string;
}

/**
 * What `callEndpoint` returns once the endpoint under test has answered.
 *
 * @remarks
 * The body is parsed for the caller rather than left as a raw `Response`, since a test assertion
 * almost always wants a value out of the body, not the object that carries one: `{ _raw: text }`
 * for the rare case where the response is not JSON still lets a test see what actually came back
 * instead of the parse failing silently.
 */
export interface ApiCallResult {
  /** The response's HTTP status code. */
  readonly status: number;

  /** The response body, parsed as JSON, or `{ _raw: text }` when it does not parse. */
  readonly body: Record<string, unknown>;
}

export function callEndpoint(
  handler: () => Future<Response>,
  body: unknown = {},
  options: ApiCallOptions = {},
): Future<ApiCallResult> {
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

async function _json(response: Response): Future<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { _raw: text };
  }
}
