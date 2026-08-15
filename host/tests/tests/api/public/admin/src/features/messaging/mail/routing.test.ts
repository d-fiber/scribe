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

import { MailRouter } from "@scribe/host/api/public/admin/src/features/messaging/mail/routes.ts";
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

function mailRoutes(): string[] {
  return tableOf(MailRouter.create());
}

Deno.test("routing: mail exposes five sub-modules and a single send verb", () => {
  const segments = new Set(
    mailRoutes().map((route) => route.split(" ")[1].split("/")[1]),
  );

  assertEquals(
    [...segments].sort(),
    ["account", "campaign", "message", "send", "statistics", "template"],
  );
});

Deno.test("routing: template lookup by name is not swallowed by :id", () => {
  const table = mailRoutes();
  const byName = table.indexOf("GET /template/by-name/:name{.+}");
  const byId = table.indexOf("GET /template/:id");

  assert(byName !== -1, "the by-name lookup must exist");
  assert(byId !== -1, "the by-id read must exist");

  const declared = MailRouter.create().routes
    .filter((route) => route.path.startsWith("/template/") && route.method === "GET")
    .map((route) => route.path);

  assert(
    declared.indexOf("/template/by-name/:name{.+}") < declared.indexOf("/template/:id"),
    "by-name must be registered before :id, otherwise :id matches 'by-name' first",
  );
});

Deno.test("routing: campaign /due is registered before :id", () => {
  const declared = MailRouter.create().routes
    .filter((route) => route.path.startsWith("/campaign/") && route.method === "GET")
    .map((route) => route.path);

  assert(
    declared.indexOf("/campaign/due") < declared.indexOf("/campaign/:id"),
    "otherwise GET /campaign/due resolves as the campaign with id 'due'",
  );
});

Deno.test("routing: the full mail surface is frozen", () => {
  assertEquals(mailRoutes(), [
    "DELETE /account/:name",
    "DELETE /account/:name/credentials",
    "DELETE /campaign/:id",
    "DELETE /message/:id",
    "DELETE /statistics/:id",
    "DELETE /template/:id",
    "GET /account",
    "GET /account/:name",
    "GET /campaign",
    "GET /campaign/:id",
    "GET /campaign/due",
    "GET /message",
    "GET /message/:id",
    "GET /statistics/:id",
    "GET /statistics/message/:id",
    "GET /template",
    "GET /template/:id",
    "GET /template/by-name/:name{.+}",
    "PATCH /account/:name/status",
    "PATCH /campaign/:id",
    "PATCH /campaign/:id/status",
    "PATCH /template/:id",
    "POST /campaign",
    "POST /send",
    "POST /template",
    "PUT /account/:name",
  ]);
});

Deno.test("routing: statistics are read-only from the admin side", () => {
  const writes = mailRoutes().filter(
    (route) =>
      route.startsWith("POST /statistics") ||
      route.startsWith("PUT /statistics") ||
      route.startsWith("PATCH /statistics"),
  );

  assertEquals(
    writes,
    [],
    "opens are recorded by the tracking pixel only, never by an admin call",
  );
});

Deno.test("routing: sent mails cannot be rewritten from the admin side", () => {
  const writes = mailRoutes().filter(
    (route) =>
      route.startsWith("POST /message") ||
      route.startsWith("PUT /message") ||
      route.startsWith("PATCH /message"),
  );

  assertEquals(writes, [], "the history is a log: read and delete only");
});
