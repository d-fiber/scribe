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

import { INTERNAL_SEGMENTS, resolveRootRoute } from "@scribe/core/kernel/http/routing/root_route.ts";
import { assertEquals } from "@std/assert";

Deno.test("the admin surface is reached under its own segment", () => {
  assertEquals(resolveRootRoute("/admin/team/role"), {
    surface: "admin",
    subPath: "/team/role",
  });
});

Deno.test("the app surface is reached under its own segment", () => {
  assertEquals(resolveRootRoute("/app/auth/sign-in/email"), {
    surface: "app",
    subPath: "/auth/sign-in/email",
  });
});

Deno.test("internal services answer on their bare prefix", () => {
  for (const segment of INTERNAL_SEGMENTS) {
    assertEquals(
      resolveRootRoute(`/${segment}`)?.surface,
      "internal",
      `${segment} is called directly on api:3000 by Caddy, GoTrue or another container`,
    );
    assertEquals(resolveRootRoute(`/${segment}/anything`)?.surface, "internal");
  }
});

Deno.test("no internal service is reachable through the app surface", () => {
  for (const segment of INTERNAL_SEGMENTS) {
    const route = resolveRootRoute(`/app/${segment}`);

    assertEquals(
      route?.surface,
      "app",
      `Kong maps /v1/app/* onto /app/*: if ${segment} answered here, the public app domain would expose it`,
    );
  }
});

Deno.test("no internal service is reachable through the admin surface", () => {
  for (const segment of INTERNAL_SEGMENTS) {
    assertEquals(resolveRootRoute(`/admin/${segment}`)?.surface, "admin");
  }
});

Deno.test("auth/intra stays out of reach of the public surfaces", () => {
  assertEquals(resolveRootRoute("/app/auth/intra")?.surface, "app");
  assertEquals(resolveRootRoute("/admin/auth/intra")?.surface, "admin");
  assertEquals(resolveRootRoute("/auth/intra")?.surface, "internal");
});

Deno.test("an unclaimed path resolves to nothing instead of falling back", () => {
  assertEquals(resolveRootRoute("/"), null);
  assertEquals(resolveRootRoute("/auth/sign-in/email"), null);
  assertEquals(resolveRootRoute("/gotrue-lookalike"), null);
  assertEquals(resolveRootRoute("/queueue/drain"), null);
});

Deno.test("a segment that merely starts like an internal one is not internal", () => {
  assertEquals(resolveRootRoute("/messagingx"), null);
  assertEquals(resolveRootRoute("/queue-admin/drain"), null);
});
