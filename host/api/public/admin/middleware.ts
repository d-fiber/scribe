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

import { clients } from "@scribe/host/dependencies/clients.ts";
import { DeviceCheckResult } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { Env } from "@scribe/host/env.ts";
import { guardMiddleware } from "@scribe/core/kernel/http/routing/guard.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { AppKeyFirewall } from "@scribe/core/kernel/identity/firewall/app_key.ts";
import { RbacIdentity, RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { MAX_FORM_BYTES } from "@scribe/core/runtime/http/limits.ts";
import { isInSubnetPrefix, resolveClientIp } from "@scribe/core/runtime/http/ip/mod.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

export function isVpnConnected(): boolean {
  const ip = resolveClientIp(RequestScope.get().headers, RequestScope.peer());
  return !!ip && isInSubnetPrefix(ip, Env.WG_SUBNET_PREFIX);
}

export const requireVpn = guardMiddleware(isVpnConnected, () =>
  ServerResponse.forbidden({
    code: "vpn_required",
    message: "This action can only be performed over a VPN connection.",
  }));

export const requireAdminAppKey = guardMiddleware(
  () => AppKeyFirewall.verify("x-admin-app-key", Env.ADMIN_APP_KEYS),
  () => ServerResponse.unauthorized(),
);

export const adminOnly = createMiddleware(async (_c, next) => {
  if (!(await RequestIdentity.isAdmin())) return ServerResponse.unauthorized();

  const adminId = await RequestIdentity.userId();
  if (!adminId) return ServerResponse.unauthorized();

  if ((await requestDevice()) === null) return ServerResponse.badRequest();

  const check = await clients.security.auth.user.devices.verify(adminId);
  switch (check) {
    case DeviceCheckResult.Ok:
      break;
    case DeviceCheckResult.NotFound:
      return ServerResponse.notFound();
    case DeviceCheckResult.Tampered:
      return ServerResponse.forbidden();
    default:
      return ServerResponse.unexpected();
  }

  await next();
});

export const requireValidBody = createMiddleware(async (_c, next) => {
  if (request.contentType() === "multipart/form-data") {
    if (request.contentLength() > MAX_FORM_BYTES) {
      return ServerResponse.payloadTooLarge();
    }
  } else if (request.isBodyTooLarge()) {
    return ServerResponse.payloadTooLarge();
  }
  await next();
});

export function permission(permission: string): MiddlewareHandler {
  return guardMiddleware(
    async () => (await RbacIdentity.permissions()).includes(permission),
    () =>
      ServerResponse.forbidden({
        code: "not_permitted",
        message: "You do not have the required permission to perform this action.",
      }),
  );
}
