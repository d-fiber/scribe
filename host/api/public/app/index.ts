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

import "../../bootstrap.ts";
import {
  healthCheck,
  requireAllowedCountry,
  requireAppKey,
  requireDevicePayload,
  requireValidBody,
  userOnly,
} from "@scribe/host/api/public/app/middleware.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { Router } from "@scribe/core/kernel/http/routing/router.ts";
import { serveFunction } from "@scribe/core/kernel/http/serve/mod.ts";
import { ApiSurface, declareApiSurface } from "@scribe/core/kernel/http/routing/api_surface.ts";
import { resolveIdentity } from "@scribe/core/kernel/identity/middleware.ts";
import { Dependencies } from "@scribe/core/runtime/dependencies.ts";
import { Hono } from "hono";
import { projectHost, ProjectSlot } from "@scribe/host/project/mod.ts";
import { trackMailOpen } from "../../internal/messaging/email/src/open/handler.ts";
import { AuthRouter } from "./src/auth/router.ts";
import { FeaturesRouter } from "./src/features/routes.ts";
import { SyncRouter } from "./src/sync/router.ts";
import { UserRouter } from "./src/user/router.ts";

const projectAppApp = (await projectHost.load<{ app: Hono }>(ProjectSlot.AppRoutes))?.app;

class App extends Router {
  protected routes(app: Hono): void {
    app.use("*", declareApiSurface(ApiSurface.App));
    app.get("/mail/open/:token", trackMailOpen);
    app.use("*", resolveIdentity);
    app.use("*", requireAppKey);
    app.use("*", requireAllowedCountry);
    app.use("*", requireDevicePayload);
    app.use("*", requireValidBody);
    app.get("/health", healthCheck, (c) => c.json({ ok: true }));
    app.route("/auth", AuthRouter.create());
    app.route("/user", UserRouter.create(userOnly));
    if (Dependencies.has("database/realtime")) app.route("/sync", SyncRouter.create(userOnly));
    app.route("/features", FeaturesRouter.create());
    if (projectAppApp) app.route("/", projectAppApp);
    app.all("*", () => ServerResponse.methodNotAllowed());
  }
}

export const app = App.create();

if (import.meta.main) serveFunction(app, "app");
