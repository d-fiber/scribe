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

import { SurfaceRegistry } from "@scribe/host/boot/server/surface_registry.ts";
import { SurfaceRouter } from "@scribe/host/boot/server/surface_router.ts";
import { INTERNAL_SEGMENTS } from "@scribe/core/kernel/http/routing/root_route.ts";
import { pathnameOf } from "@scribe/core/runtime/http/pathname.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { assertEquals } from "@std/assert";
import { Hono } from "hono";

function surfaceEcho(label: string): Hono {
  const app = new Hono();
  app.all("*", (c) =>
    c.json({
      label,
      path: new URL(c.req.url).pathname,
      offset: c.req.query("offset") ?? null,
      scopedOffset: new URL(RequestScope.get().url).searchParams.get("offset"),
    }));
  return app;
}

function registry(): SurfaceRegistry {
  const internal = Object.fromEntries(
    INTERNAL_SEGMENTS.map((segment) => [segment, surfaceEcho(segment)]),
  ) as Record<(typeof INTERNAL_SEGMENTS)[number], Hono>;

  return SurfaceRegistry.compose({
    admin: surfaceEcho("admin"),
    app: surfaceEcho("app"),
    internal,
  }, (app) => app);
}

function route(pathname: string): Promise<Response> {
  const router = new SurfaceRouter(registry());
  return RequestScope.run(
    new Request(`http://localhost${pathname}`),
    new Uint8Array(0),
    () => router.route(pathname),
    null,
  );
}

Deno.test("SurfaceRouter answers the health check without touching a surface", async () => {
  const response = await route("/_health");

  assertEquals(response.status, 200);
  assertEquals(await response.text(), "ok");
});

Deno.test("SurfaceRouter forwards to the admin surface with the prefix stripped", async () => {
  const response = await route("/admin/team/roles");
  const body = (await response.json()) as { label: string; path: string };

  assertEquals(body.label, "admin");
  assertEquals(body.path, "/team/roles");
});

Deno.test("SurfaceRouter forwards to the app surface", async () => {
  const response = await route("/app/user/account");
  const body = (await response.json()) as { label: string; path: string };

  assertEquals(body.label, "app");
  assertEquals(body.path, "/user/account");
});

Deno.test("SurfaceRouter mounts every internal service under its own segment", async () => {
  for (const segment of INTERNAL_SEGMENTS) {
    const response = await route(`/${segment}/ping`);
    const body = (await response.json()) as { label: string; path: string };

    assertEquals(body.label, segment);
    assertEquals(body.path, `/${segment}/ping`);
  }
});

Deno.test("SurfaceRouter answers 404 on a path no surface claims", async () => {
  const response = await route("/nowhere");

  assertEquals(response.status, 404);
});

Deno.test("SurfaceRouter hands the surface the query string, not just the path", async () => {
  const url = "http://localhost/admin/team/roles?offset=40&size=10";
  const router = new SurfaceRouter(registry());

  const response = await RequestScope.run(
    new Request(url),
    new Uint8Array(0),
    () => router.route(pathnameOf(url)),
    null,
  );

  const body = (await response.json()) as {
    path: string;
    offset: string | null;
    scopedOffset: string | null;
  };

  assertEquals(body.path, "/team/roles");
  assertEquals(body.offset, "40");
  assertEquals(body.scopedOffset, "40");
});
