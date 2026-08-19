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

import type { SessionAdmin, SessionUser } from "@scribe/core/contracts/account.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Caller } from "@scribe/core/kernel/endpoint/access.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import type { RouteDescriptor } from "@scribe/core/kernel/http/routing/descriptor.ts";
import { mountDescriptors } from "@scribe/core/kernel/http/routing/descriptor_mount.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { installRateLimiterMock } from "@scribe/foundation/testing/valkery.ts";
import { assertEquals } from "@std/assert";
import { Hono } from "hono";

const anAdmin: SessionAdmin = {
  id: "admin-1",
  email: "admin@test.io",
  rules: { role: "editor", permissions: ["brand:read"] },
};

const aUser: SessionUser = { id: "user-1", email: "user@test.io" };

let reached: string | null = null;

function aRoute(overrides: Partial<RouteDescriptor> = {}): RouteDescriptor {
  return {
    method: "get",
    path: "/brands/:brandId",
    access: Caller.Admin,
    rateLimit: { limit: 10, window: Time.minutes(1), penalty: Time.minutes(1) },
    rateLimitKey: "descriptor-mount:read-brand",
    requiredPermissions: ["brand:read"],
    handler: (invocation) => {
      reached = invocation.pathParams.brandId;
      return ServerResponse.ok({ data: { brandId: invocation.pathParams.brandId } });
    },
    ...overrides,
  };
}

function appOf(descriptor: RouteDescriptor): Hono {
  const app = new Hono();
  mountDescriptors(app, [descriptor]);
  return app;
}

function call(app: Hono, identity?: SessionAdmin | SessionUser) {
  return callEndpoint(
    async () => await app.request("/brands/42", { method: "GET" }),
    {},
    { method: "GET", path: "/brands/42", identity },
  );
}

Deno.test("mountDescriptors: an anonymous caller never reaches the handler", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute()));

    assertEquals(result.status, 401);
    assertEquals(reached, null);
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: access is checked before permissions, so a user gets 401 and not 403", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute()), aUser);

    assertEquals(result.status, 401, "you cannot lack a permission you were never asked for");
    assertEquals(reached, null);
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: an admin missing the declared permission is forbidden", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute({ requiredPermissions: ["brand:publish"] })), anAdmin);

    assertEquals(result.status, 403);
    assertEquals(result.body.code, "not_permitted");
    assertEquals(reached, null);
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: every declared permission is required, not just one of them", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const app = appOf(aRoute({ requiredPermissions: ["brand:read", "brand:publish"] }));
    const result = await call(app, anAdmin);

    assertEquals(result.status, 403);
    assertEquals(reached, null);
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: the rate limit is spent after access, never before", async () => {
  reached = null;
  const limiter = installRateLimiterMock({
    ok: false,
    retryAfter: 60,
    strikes: 1,
  });
  try {
    const result = await call(appOf(aRoute()), anAdmin);

    assertEquals(result.status, 429);
    assertEquals(reached, null);
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: a route that clears the three checks receives its path params", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute()), anAdmin);

    assertEquals(result.status, 200);
    assertEquals(reached, "42", "the handler reads Hono's params, it never sees the Context");
    assertEquals(result.body.data, { brandId: "42" });
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: declaring no permission asks for none", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute({ requiredPermissions: undefined })), anAdmin);

    assertEquals(result.status, 200);
    assertEquals(reached, "42");
  } finally {
    limiter.restore();
  }
});
