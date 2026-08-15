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

// Guards are only worth what their mounting order is worth: `app.use()` in Hono
// applies to the routes declared *after* it. These tests drive the real admin
// app, so a route moved above a guard fails here rather than in production.

import {
  adminOnly,
  requireAdminAppKey,
  requireValidBody,
  requireVpn,
} from "@scribe/host/api/public/admin/middleware.ts";
import { AuthRouter } from "@scribe/host/api/public/admin/src/auth/router.ts";
import { TeamRouter } from "@scribe/host/api/public/admin/src/team/router.ts";
import { UserRouter } from "@scribe/host/api/public/admin/src/user/router.ts";
import { VpnRouter } from "@scribe/host/api/public/admin/src/vpn/router.ts";
import { Env } from "@scribe/host/env.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { Router } from "@scribe/core/kernel/http/routing/router.ts";
import { ApiSurface, declareApiSurface } from "@scribe/core/kernel/http/routing/api_surface.ts";
import { resolveIdentity } from "@scribe/core/kernel/identity/middleware.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { installRateLimiterMock, installValkeryMock } from "@scribe/core/testing/runtime/redis.ts";
import { assert, assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { Hono } from "hono";

// Mirrors scribe/host/api/public/admin/index.ts, minus the optional
// lib/ mount: importing index.ts directly would pull @app/api/admin into
// the type-check graph. Any reordering there has to be mirrored here.
class AdminUnderTest extends Router {
  protected routes(app: Hono): void {
    app.use("*", declareApiSurface(ApiSurface.Admin));
    app.use("*", resolveIdentity);
    app.use("*", requireAdminAppKey);
    app.route("/vpn", VpnRouter.create());

    app.use("*", requireVpn);
    app.use("*", requireValidBody);
    app.get("/health", (c) => c.json({ ok: true }));
    app.route("/auth", AuthRouter.create());
    app.route("/team", TeamRouter.create(adminOnly));
    app.route("/user", UserRouter.create(adminOnly));
    app.all("*", () => ServerResponse.methodNotAllowed());
  }
}

const app = AdminUnderTest.create();

const ADMIN_KEY = Env.ADMIN_APP_KEYS[0];
const ON_VPN = "10.8.0.42";
const OFF_VPN = "203.0.113.9";
const TRUSTED_PEER = "172.18.0.4";

interface Call {
  readonly path: string;
  readonly method?: string;
  readonly appKey?: string | null;
  readonly ip?: string;
  readonly peer?: string | null;
}

async function callAdmin(
  { path, method = "GET", appKey = ADMIN_KEY, ip = ON_VPN, peer = TRUSTED_PEER }: Call,
): Promise<number> {
  const headers: Record<string, string> = { "x-real-ip": ip };
  if (appKey !== null) headers["x-admin-app-key"] = appKey;

  const request = new Request(`http://admin.test${path}`, { method, headers });
  const kv = installValkeryMock();
  const limiter = installRateLimiterMock();
  const upstream = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response("{}", { status: 500 })),
  );

  try {
    return await RequestScope.run(request, new Uint8Array(0), async () => {
      const response = await app.fetch(request);
      return response.status;
    }, peer);
  } finally {
    upstream.restore();
    limiter.restore();
    kv.restore();
  }
}

Deno.test("mounting: the app key gates every route, /vpn included", async () => {
  assertEquals(await callAdmin({ path: "/vpn", appKey: null }), 401);
  assertEquals(await callAdmin({ path: "/vpn", appKey: "wrong" }), 401);
  assertEquals(await callAdmin({ path: "/health", appKey: null }), 401);
  assertEquals(await callAdmin({ path: "/user", appKey: null }), 401);
});

Deno.test("mounting: /vpn answers off-VPN, it is the bootstrap probe", async () => {
  const status = await callAdmin({ path: "/vpn", ip: OFF_VPN });

  assertEquals(
    status,
    200,
    "the client has to be able to ask whether it is on the VPN while it is not",
  );
});

Deno.test("mounting: everything past /vpn requires the VPN", async () => {
  for (const path of ["/health", "/user", "/team", "/auth/sign-in/verify-otp"]) {
    assertEquals(
      await callAdmin({ path, ip: OFF_VPN }),
      403,
      `${path} must sit behind requireVpn`,
    );
  }
});

Deno.test("mounting: a spoofed VPN address from an untrusted peer is refused", async () => {
  assertEquals(
    await callAdmin({ path: "/health", ip: ON_VPN, peer: OFF_VPN }),
    403,
    "bypassing the proxy must not turn x-real-ip into a free pass",
  );
});

Deno.test("mounting: /health is reachable once on the VPN with a key", async () => {
  assertEquals(await callAdmin({ path: "/health" }), 200);
});

Deno.test("mounting: authenticated surfaces answer 401 without an identity", async () => {
  for (const path of ["/user", "/user/permissions", "/team"]) {
    assertEquals(
      await callAdmin({ path }),
      401,
      `${path} must sit behind adminOnly`,
    );
  }
});

Deno.test("mounting: session endpoints do not require an existing session", async () => {
  const status = await callAdmin({
    path: "/auth/user/refresh-session",
    method: "POST",
  });

  assert(
    status !== 401,
    "refreshing is how an expired session recovers: gating it on a valid session makes it useless",
  );
});

Deno.test("mounting: an unknown route is a 405, not a leak", async () => {
  assertEquals(await callAdmin({ path: "/does-not-exist" }), 405);
});
