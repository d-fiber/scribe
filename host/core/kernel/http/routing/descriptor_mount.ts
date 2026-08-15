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

import type { Context, Hono } from "hono";
import { callersOf, isAllowed } from "@scribe/core/kernel/endpoint/access.ts";
import { withinRateLimit } from "@scribe/core/kernel/endpoint/rate_limit.ts";
import { RbacIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import type { RouteDescriptor } from "./descriptor.ts";

async function grantsAll(required: readonly string[]): Promise<boolean> {
  const granted = await RbacIdentity.permissions();
  return required.every((permission) => granted.includes(permission));
}

async function serve(descriptor: RouteDescriptor, c: Context): Promise<Response> {
  const callers = callersOf(descriptor.access);
  if (!(await isAllowed(callers, descriptor.webhookVerified ?? false))) {
    return ServerResponse.unauthorized();
  }

  const required = descriptor.requiredPermissions ?? [];
  if (required.length > 0 && !(await grantsAll(required))) {
    return ServerResponse.forbidden({
      code: "not_permitted",
      message: "You do not have the required permission to perform this action.",
    });
  }

  if (!(await withinRateLimit(descriptor.rateLimitKey, descriptor.rateLimit))) {
    return ServerResponse.tooManyRequests();
  }

  return descriptor.handler({ pathParams: c.req.param() });
}

export function mountDescriptors(app: Hono, descriptors: readonly RouteDescriptor[]): void {
  for (const descriptor of descriptors) {
    app[descriptor.method](descriptor.path, (c) => serve(descriptor, c));
  }
}
