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

import type { Future } from "@scribe/alchemy";
import "@scribe/runtime/support/edge_runtime_shim.ts";
import type { LoggedLevel } from "@scribe/alchemy/observe";
import { previewOf } from "@scribe/kernel/observability/body_preview.ts";
import { levelForStatus } from "@scribe/kernel/observability/level.ts";
import { LogRoutes } from "@scribe/kernel/observability/log_routing.ts";
import { logBuffer } from "@scribe/kernel/observability/log_delivery.ts";
import { request } from "@scribe/runtime/http/request.ts";
import { Hono } from "hono";
import { honoRouter } from "@scribe/kernel/http/routing/hono_router.ts";
import { createMiddleware } from "hono/factory";

declare const EdgeRuntime: { waitUntil(p: Future<unknown>): void };

/**
 * Holds the exchange for the project's sink, and never makes the client wait.
 *
 * The buffer answers with a publish only when this entry filled the batch, so
 * `waitUntil` is armed on the requests that flush rather than on all of them.
 * A project that declared no `_logs.ts` has no sink, and the batch is dropped
 * on delivery rather than being kept from here: this path stays the same
 * whether anybody is reading or not.
 */
function ship(
  method: string,
  route: string,
  status: number,
  level: LoggedLevel,
  node: string | null,
  preview: string,
): void {
  try {
    const published = logBuffer.record({
      level,
      action: route,
      node,
      actorType: null,
      actorId: null,
      traceId: null,
      invocationId: null,
      // The preview is left out entirely rather than sent empty: it exists on
      // failures alone, and an empty string in every other entry would be a
      // field a sink has to check before it can use it.
      metadata: preview === "" ? { method, status } : { method, status, preview },
      timestamp: Date.now(),
    });

    if (published !== null) EdgeRuntime.waitUntil(published);
  } catch (error) {
    console.error("[logger] could not enqueue the request log:", error);
  }
}

const observeExchange = createMiddleware(async (c, next) => {
  await next();

  const method = request.method();
  const route = request.path();
  const level = levelForStatus(c.res.status);
  const node = LogRoutes.current.nodeOf(route);

  // The await stays here rather than being deferred with the delivery: the
  // preview reads a clone of a body the runtime is about to stream, so
  // deferring it would race the read against a response already gone out. It
  // costs nothing under 400, where `previewOf` answers before reading anything.
  let preview = "";
  try {
    preview = await previewOf(c.res);
  } catch (error) {
    console.error("[logger] could not read the response body:", error);
  }

  ship(method, route, c.res.status, level, node, preview);
});

export function logger(app: Hono): Hono {
  const root: Hono = honoRouter();
  root.use("*", observeExchange);
  root.route("/", app);
  return root;
}
