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

import { searcher } from "@scribe/host/dependencies/features/searcher/mod.ts";
import { requestDevice } from "@scribe/core/runtime/device/device.ts";
import { RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { kv } from "@scribe/core/runtime/redis/mod.ts";
import { DeviceCheckResult } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { rest } from "@scribe/host/dependencies/database/rest/rest.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { AppKeyFirewall } from "@scribe/core/kernel/identity/firewall/app_key.ts";
import { CountryFirewall } from "./_country_firewall.ts";
import { Env } from "@scribe/host/env.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { guardMiddleware } from "@scribe/core/kernel/http/routing/guard.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { createMiddleware } from "hono/factory";

export const healthCheck = createMiddleware(async (_c, next) => {
  const [redisResult, supabaseResult, searcherResult] = await Promise.allSettled([
    kv().ping(),
    rest
      .internal_t__app_user_devices()
      .select((s) => ({ id: s.id }))
      .getOne(),
    searcher.ping(),
  ]);

  if (redisResult.status === "rejected") return ServerResponse.unexpected();
  if (supabaseResult.status === "rejected") return ServerResponse.unexpected();
  if (searcherResult.status === "rejected") {
    return ServerResponse.unexpected();
  }

  await next();
});

export const userOnly = createMiddleware(async (_c, next) => {
  if (!(await RequestIdentity.isUser())) return ServerResponse.unauthorized();

  const userId = await RequestIdentity.userId();
  if (!userId) return ServerResponse.unauthorized();

  const check = await clients.security.auth.user.devices.verify(userId);
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

export const requireDevicePayload = guardMiddleware(
  async () => (await requestDevice()) !== null,
  () => ServerResponse.badRequest(),
);

export const requireAppKey = guardMiddleware(
  () => AppKeyFirewall.verify("x-app-key", Env.APP_KEYS),
  () => ServerResponse.unauthorized(),
);

export const requireAllowedCountry = guardMiddleware(
  () => CountryFirewall.verify(),
  () => ServerResponse.forbidden(),
);

export const requireValidBody = guardMiddleware(
  () => !request.isBodyTooLarge(),
  () => ServerResponse.payloadTooLarge(),
);
