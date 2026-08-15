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
import { printExchange } from "@scribe/core/kernel/observability/console/request_log.ts";
import { logsQueue } from "@scribe/core/kernel/observability/logs_queue.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";

declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void };

function levelFor(status: number): "info" | "warn" | "error" {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

function ship(method: string, route: string, status: number): void {
  try {
    EdgeRuntime.waitUntil(
      logsQueue.push({
        level: levelFor(status),
        action: route,
        metadata: { method, status },
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.error("[logger] could not enqueue the request log:", error);
  }
}

const observeExchange = createMiddleware(async (c, next) => {
  await next();

  const method = request.method();
  const route = request.path();

  await printExchange(method, route, c.res);
  ship(method, route, c.res.status);
});

export function logger(app: Hono): Hono {
  const root: Hono = new Hono();
  root.use("*", observeExchange);
  root.route("/", app);
  return root;
}
