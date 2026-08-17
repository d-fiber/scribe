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

import "@scribe/core/runtime/support/edge_runtime_shim.ts";
import type { LogLevel } from "@scribe/core/contracts/logging.ts";
import { levelForStatus } from "@scribe/core/kernel/observability/level.ts";
import { LogRoutes } from "@scribe/core/kernel/observability/log_routing.ts";
import { logBuffer } from "@scribe/core/kernel/observability/log_delivery.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

/**
 * Holds the exchange for the project's sink, and never makes the client wait.
 *
 * The buffer answers with a publish only when this entry filled the batch, so
 * `waitUntil` is armed on the requests that flush rather than on all of them.
 * A project that declared no `_log.ts` has no sink, and the batch is dropped
 * on delivery rather than being kept from here: this path stays the same
 * whether anybody is reading or not.
 */
function ship(
  method: string,
  route: string,
  status: number,
  level: LogLevel,
  node: string | null,
): void {
  try {
    const published = logBuffer.record({
      level,
      action: route,
      node,
      metadata: { method, status },
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

  ship(method, route, c.res.status, level, node);
});

export function logger(app: Hono): Hono {
  const root: Hono = new Hono();
  root.use("*", observeExchange);
  root.route("/", app);
  return root;
}
