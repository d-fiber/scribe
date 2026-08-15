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

import { MessagingRouter } from "@scribe/host/api/public/admin/src/features/messaging/routes.ts";
import { PushRouter } from "@scribe/host/api/public/admin/src/features/messaging/push/routes.ts";
import { assert, assertEquals } from "@std/assert";
import { Hono } from "hono";

function tableOf(app: Hono): string[] {
  return [
    ...new Set(
      app.routes
        .filter((route) => route.method !== "ALL")
        .map((route) => `${route.method} ${route.path}`),
    ),
  ].sort();
}

function pushRoutes(): string[] {
  return tableOf(PushRouter.create());
}

Deno.test("routing: messaging now carries both channels", () => {
  const segments = new Set(
    tableOf(MessagingRouter.create()).map((route) => route.split(" ")[1].split("/")[1]),
  );

  assertEquals([...segments].sort(), ["mail", "push"], "sms has a client but no admin surface yet");
});

Deno.test("routing: push exposes four sub-modules", () => {
  const segments = new Set(
    pushRoutes().map((route) => route.split(" ")[1].split("/")[1]),
  );

  assertEquals([...segments].sort(), ["campaign", "notification", "open", "template"]);
});

Deno.test("routing: the full push surface is frozen", () => {
  assertEquals(pushRoutes(), [
    "DELETE /campaign/:id",
    "DELETE /notification/:id",
    "DELETE /open/:id",
    "DELETE /template/:id",
    "GET /campaign",
    "GET /campaign/:id",
    "GET /campaign/due",
    "GET /notification/:id",
    "GET /notification/source/:notificationId",
    "GET /open/:id",
    "GET /open/notification/:id",
    "GET /template",
    "GET /template/:id",
    "GET /template/by-name/:name{.+}",
    "PATCH /campaign/:id",
    "PATCH /campaign/:id/status",
    "PATCH /template/:id",
    "POST /campaign",
    "POST /template",
  ]);
});

Deno.test("routing: literal segments are registered before their :id sibling", () => {
  const declared = PushRouter.create().routes
    .filter((route) => route.method === "GET")
    .map((route) => route.path);

  assert(
    declared.indexOf("/campaign/due") < declared.indexOf("/campaign/:id"),
    "otherwise GET /campaign/due resolves as the campaign with id 'due'",
  );
  assert(
    declared.indexOf("/template/by-name/:name{.+}") < declared.indexOf("/template/:id"),
    "otherwise :id swallows 'by-name'",
  );
  assert(
    declared.indexOf("/notification/source/:notificationId") <
      declared.indexOf("/notification/:id"),
    "otherwise :id swallows 'source'",
  );
  assert(
    declared.indexOf("/open/notification/:id") < declared.indexOf("/open/:id"),
    "otherwise :id swallows 'notification'",
  );
});

Deno.test("routing: push has no send verb, unlike mail", () => {
  assertEquals(
    pushRoutes().filter((route) => route.includes("/send")),
    [],
    "a push starts from an in_app_notifications row, which this module does not own",
  );
});

Deno.test("routing: deliveries and opens are read-only apart from deletion", () => {
  const writes = pushRoutes().filter(
    (route) =>
      (route.startsWith("POST ") || route.startsWith("PUT ") || route.startsWith("PATCH ")) &&
      (route.includes("/notification") || route.includes("/open")),
  );

  assertEquals(writes, [], "both are logs: written by the send path and by the app, not by an admin");
});
