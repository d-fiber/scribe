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

import { create } from "@bufbuild/protobuf";
import {
  Caller as ProtoCaller,
  Method as ProtoMethod,
  Need,
} from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
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
import { requestDevice } from "@scribe/core/runtime/device/mod.ts";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { currentLocation } from "@scribe/core/runtime/http/accessors/location.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

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
 * handler logs them or echoes them back. A worker never needs any of them — it
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

function identityOf() {
  const identity = currentIdentity();
  if (!identity) return create(IdentitySchema, { caller: ProtoCaller.ANONYMOUS });

  const admin = "rules" in identity;
  return create(IdentitySchema, {
    id: identity.id,
    email: identity.email ?? "",
    caller: admin ? ProtoCaller.ADMIN : ProtoCaller.USER,
    rules: admin
      ? { role: identity.rules.role, permissions: [...identity.rules.permissions] }
      : undefined,
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
