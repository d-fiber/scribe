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

import { create } from "@bufbuild/protobuf";
import { Caller as ProtoCaller, Method as ProtoMethod, Need } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import {
  DeviceSchema,
  IdentitySchema,
  type Invocation,
  InvocationSchema,
  IpLocationSchema,
  LocalizationSchema,
  RequestSchema,
} from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import type { Route } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { requestDevice } from "@scribe/runtime/device/mod.ts";
import { currentIdentity } from "@scribe/runtime/http/accessors/identity.ts";
import { currentLocation } from "@scribe/runtime/http/accessors/location.ts";
import { request } from "@scribe/runtime/http/request.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";

const methods: Record<string, ProtoMethod> = {
  GET: ProtoMethod.GET,
  POST: ProtoMethod.POST,
  PUT: ProtoMethod.PUT,
  PATCH: ProtoMethod.PATCH,
  DELETE: ProtoMethod.DELETE,
};

/**
 * The request headers a worker is allowed to see.
 *
 * Everything else stays on the host, credentials first: `authorization` is the
 * caller's own bearer token, and `cookie`, `apikey`, `x-app-key`,
 * `x-admin-app-key` and `x-internal-secret` are replayable the moment a
 * handler logs them or echoes them back. A worker never needs any of them, since it
 * is handed the identity already resolved, in `Invocation.identity`.
 *
 * An allow list rather than a deny list, so that a secret header added later
 * stays on this side without anyone having to remember to exclude it.
 */
const FORWARDED_HEADERS: ReadonlySet<string> = new Set([
  "accept",
  "accept-language",
  "content-type",
  "if-match",
  "if-modified-since",
  "if-none-match",
  "origin",
  "range",
  "x-request-id",
]);

function headersOf(): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers().forEach((value, key) => {
    const name = key.toLowerCase();
    if (FORWARDED_HEADERS.has(name)) headers[name] = value;
  });
  return headers;
}

function queryOf(): Record<string, string> {
  const query: Record<string, string> = {};
  new URL(RequestScope.get().url).searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

/**
 * Who is calling, written the way the protocol carries it.
 *
 * @remarks
 * Every proved session goes over as `USER`, which is the protocol's word for somebody holding
 * one. `ADMIN` is never produced: what a caller is called is a word the deployment chose, and it
 * travels in `rules.role` where the worker can read it, rather than being collapsed into one of
 * two values this framework would have to define.
 */
function identityOf() {
  const identity = currentIdentity();
  if (!identity) return create(IdentitySchema, { caller: ProtoCaller.ANONYMOUS });

  return create(IdentitySchema, {
    id: identity.id,
    caller: ProtoCaller.USER,
    rules: { role: identity.role, permissions: [...identity.permissions] },
  });
}

async function deviceOf(route: Route) {
  if (!route.needs.includes(Need.DEVICE)) return undefined;

  const device = await requestDevice();
  if (!device) return undefined;

  return create(DeviceSchema, {
    deviceId: device.device_id,
    client: device.client,
    os: device.os,
    model: device.model,
    appVersion: device.app_version ?? "",
    isPhysicalDevice: device.is_physical_device,
    deviceCategory: device.device_category,
    notificationToken: device.notification_token ?? "",
    deviceToken: device.device_token ?? "",
    localization: create(LocalizationSchema, { language: String(device.localization) }),
    themeMode: device.theme_mode,
    binding: device.binding,
    iat: BigInt(device.iat),
    nonce: device.nonce ?? "",
  });
}

async function locationOf(route: Route) {
  if (!route.needs.includes(Need.LOCATION)) return undefined;

  const location = await currentLocation();
  return create(IpLocationSchema, { city: location.city, country: location.country });
}

export async function invocationOf(
  route: Route,
  pathParams: Readonly<Record<string, string>>,
  capabilityToken: string,
  traceId: string,
): Promise<Invocation> {
  return create(InvocationSchema, {
    invocationId: crypto.randomUUID(),
    traceId,
    routeId: route.routeId,
    capabilityToken,
    request: create(RequestSchema, {
      method: methods[request.method()] ?? ProtoMethod.UNSPECIFIED,
      path: request.path(),
      pathParams: { ...pathParams },
      query: queryOf(),
      headers: headersOf(),
      body: request.bytes() ?? new Uint8Array(),
      ip: request.ip(),
      userAgent: request.userAgent(),
      sessionId: request.sessionId() ?? "",
    }),
    identity: identityOf(),
    device: await deviceOf(route),
    location: await locationOf(route),
  });
}
