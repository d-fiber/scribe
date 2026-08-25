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

import type { RequestUser } from "@scribe/alchemy/route";
import { Duration } from "@scribe/alchemy";
import { ServerResponse } from "@scribe/alchemy/route";
import type { RouteDescriptor } from "@scribe/kernel/http/routing/descriptor.ts";
import { mountDescriptors } from "@scribe/kernel/http/routing/descriptor_mount.ts";
import { callEndpoint } from "@scribe/testing/kernel/endpoint.ts";
import { installRateLimiterMock } from "@scribe/foundation/tests/testing/cache.ts";
import { assertEquals } from "@std/assert";
import { Hono } from "hono";

const anEditor: RequestUser = {
  id: "editor-1",
  caller: "authenticated",
  role: "editor",
  permissions: ["brand:read"],
  claims: {},
};

const aCaller: RequestUser = {
  id: "caller-1",
  caller: "authenticated",
  role: "",
  permissions: [],
  claims: {},
};

let reached: string | null = null;

function aRoute(overrides: Partial<RouteDescriptor> = {}): RouteDescriptor {
  return {
    method: "get",
    path: "/brands/:brandId",
    access: "authenticated",
    rateLimit: { limit: 10, window: Duration.minutes(1), penalty: Duration.minutes(1) },
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

function call(app: Hono, identity?: RequestUser) {
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

Deno.test("mountDescriptors: access is checked before permissions, so an unproved call gets 401 and not 403", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute({ access: "service" })), aCaller);

    assertEquals(result.status, 401, "you cannot lack a permission you were never asked for");
    assertEquals(reached, null);
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: a session is a session, so an administrator answers a route open to any of them", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    assertEquals((await call(appOf(aRoute()), anEditor)).status, 200);
    assertEquals(reached, "42");
  } finally {
    limiter.restore();
  }
});

Deno.test("mountDescriptors: an admin missing the declared permission is forbidden", async () => {
  reached = null;
  const limiter = installRateLimiterMock();
  try {
    const result = await call(appOf(aRoute({ requiredPermissions: ["brand:publish"] })), anEditor);

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
    const result = await call(app, anEditor);

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
    const result = await call(appOf(aRoute()), anEditor);

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
    const result = await call(appOf(aRoute()), anEditor);

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
    const result = await call(appOf(aRoute({ requiredPermissions: undefined })), anEditor);

    assertEquals(result.status, 200);
    assertEquals(reached, "42");
  } finally {
    limiter.restore();
  }
});
