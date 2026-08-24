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

import "../bootstrap.ts";
import { ServerResponse } from "@scribe/alchemy/route";
import { Router } from "@scribe/core/kernel/http/routing/router.ts";
import { serveFunction } from "@scribe/core/kernel/http/serve/mod.ts";
import { queueRegistry } from "@scribe/foundation/lib/src/queue/core/registry.ts";
import { extensions } from "@scribe/core/runtime/support/extensions/mod.ts";
import { EXTENSION_QUEUE } from "../extensions.ts";
import { Hono } from "hono";
import { QueueDrainEndpoint, QueueDrainOneEndpoint, QueueStatusEndpoint } from "./queue_drain.ts";

await extensions.load(EXTENSION_QUEUE);
console.info(queueRegistry.report());

/**
 * The only internal surface the framework still serves.
 *
 * Draining a queue is not a feature, it is how the runtime is driven from
 * outside the persistent process, so it stays here while the surfaces that
 * answered for a module left with it.
 */
class Queue extends Router {
  protected routes(app: Hono): void {
    app.post("/drain", () => QueueDrainEndpoint.handle());
    app.post("/drain/:name", (c) => QueueDrainOneEndpoint.handle(c.req.param("name")));
    app.get("/status", () => QueueStatusEndpoint.handle());
    app.all("*", () => ServerResponse.notFound());
  }
}

export const app = Queue.create();

if (import.meta.main) serveFunction(app, "queue");
