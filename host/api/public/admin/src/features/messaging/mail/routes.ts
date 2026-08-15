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

import { Router } from "@scribe/core/kernel/http/routing/router.ts";
import { Hono } from "hono";
import { AccountRouter } from "./account/router.ts";
import { CampaignRouter } from "./campaign/router.ts";
import { MessageRouter } from "./message/router.ts";
import { AdminMailSendEndpoint } from "./send.ts";
import { StatisticsRouter } from "./statistics/router.ts";
import { TemplateRouter } from "./template/router.ts";

export class MailRouter extends Router {
  protected routes(app: Hono): void {
    app.post("/send", () => AdminMailSendEndpoint.handle());
    app.route("/account", AccountRouter.create());
    app.route("/campaign", CampaignRouter.create());
    app.route("/message", MessageRouter.create());
    app.route("/statistics", StatisticsRouter.create());
    app.route("/template", TemplateRouter.create());
  }
}
