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

import { AuthRouter } from "@scribe/host/api/public/admin/src/auth/router.ts";
import { TeamRouter } from "@scribe/host/api/public/admin/src/team/router.ts";
import { UserRouter } from "@scribe/host/api/public/admin/src/user/router.ts";
import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";

const passThrough: MiddlewareHandler = createMiddleware(
  async (_c, next) => await next(),
);

function tableOf(app: Hono): string[] {
  return [
    ...new Set(
      app.routes
        .filter((route) => route.method !== "ALL")
        .map((route) => `${route.method} ${route.path}`),
    ),
  ].sort();
}

function authRoutes(): string[] {
  return tableOf(AuthRouter.create(passThrough));
}

function userRoutes(): string[] {
  return tableOf(UserRouter.create(passThrough));
}

function teamRoutes(): string[] {
  return tableOf(TeamRouter.create(passThrough));
}

Deno.test("routing: admin sign-in stays email-only", () => {
  assertEquals(
    authRoutes().filter((r) => r.includes("/sign-in/")),
    [
      "POST /sign-in/resend-otp",
      "POST /sign-in/verify-otp",
      "POST /sign-in/with-email-and-password",
    ],
  );
});

Deno.test("routing: admin reset-password only sends the mail", () => {
  assertEquals(
    authRoutes().filter((r) => r.includes("/reset-password")),
    ["POST /reset-password/email/send"],
    "the completion happens on hosting/reset, in the browser: the admin app never holds a reset token",
  );
});

Deno.test("routing: /auth/user is down to the two session verbs", () => {
  assertEquals(
    authRoutes().filter((r) => r.includes("/user")),
    [
      "POST /user/recover-session",
      "POST /user/refresh-session",
    ],
  );
});

Deno.test("routing: the current admin and its permissions live under /user", () => {
  assertEquals(
    userRoutes().filter((r) => r === "GET /" || r === "GET /permissions"),
    ["GET /", "GET /permissions"],
  );
});

Deno.test("routing: sign-out and password live under /user/account", () => {
  const table = userRoutes();

  assertEquals(
    table.filter((r) => r.includes("/account/sign-out")),
    ["POST /account/sign-out"],
  );
  assertEquals(
    table.filter((r) => r.includes("/account/update/")),
    ["POST /account/update/password"],
  );
});

Deno.test("routing: admin devices mirror the app device surface", () => {
  assertEquals(
    userRoutes().filter((r) => r.includes("/account/devices")),
    [
      "DELETE /account/devices/:deviceId",
      "GET /account/devices",
      "GET /account/devices/current",
    ],
  );
});

Deno.test("routing: roles are a sub-surface of the team", () => {
  assertEquals(
    teamRoutes().filter((r) => / \/role(\/|$)/.test(r)),
    [
      "DELETE /role/role",
      "GET /role",
      "GET /role/:role",
      "POST /role/role",
      "PUT /role/role/permissions",
    ],
  );
});

Deno.test(
  "routing: /role is registered before the member :adminId catch-all",
  () => {
    const registered = TeamRouter.create(passThrough).routes
      .filter((route) => route.method !== "ALL")
      .map((route) => `${route.method} ${route.path}`);

    const firstRole = registered.findIndex((r) => r.startsWith("GET /role"));
    const memberRead = registered.indexOf("GET /:adminId");

    assertNotEquals(firstRole, -1);
    assertNotEquals(memberRead, -1);
    assert(
      firstRole < memberRead,
      'Hono matches in registration order: mount /role after the member router and GET /team/role reads an admin whose id is "role"',
    );
  },
);

Deno.test(
  "routing: every destructive member route is wired behind refuseSelf",
  () => {
    const registered = TeamRouter.create(passThrough).routes.map((route) =>
      `${route.method} ${route.path} ${route.handler.name}`
    );

    // Hono records one entry per handler, middleware included, so the count is
    // the wiring. Pinned exactly: a dropped guard lowers it, and the test says so.
    const handlersOf = (route: string) => registered.filter((r) => r.startsWith(`${route} `)).length;

    assertEquals(
      handlersOf("DELETE /:adminId"),
      4,
      "permission + refuseSelf + memberAuthority + handler: losing one lets an admin delete their own account",
    );
    assertEquals(
      handlersOf("POST /:adminId/vpn/renew"),
      4,
      "permission + refuseSelf + memberAuthority + handler",
    );
    assertEquals(
      handlersOf("ALL /:adminId/update/*"),
      4,
      "adminOnly + permission + refuseSelf + memberAuthority: the guard sits on the wildcard, so it covers every /update route at once, /role included",
    );

    const updateRoutes = registered.filter((r) => r.startsWith("PATCH /:adminId/update/"));
    assert(
      updateRoutes.length === 7,
      "the seven update routes must all inherit the wildcard guard rather than carry their own",
    );
  },
);
