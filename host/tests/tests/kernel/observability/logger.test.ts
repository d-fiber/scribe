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

import { assertEquals } from "@std/assert";
import { Hono } from "hono";
import type { LoggedEntry } from "@scribe/alchemy/observe";
import type { LogRouting } from "@scribe/core/contracts/logging.ts";
import { logger } from "@scribe/core/kernel/observability/logger.ts";
import { LogRoutes } from "@scribe/core/kernel/observability/log_routing.ts";
import { logBuffer } from "@scribe/core/kernel/observability/log_delivery.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

/** What the routing below was handed, flattened across deliveries. */
const taken: LoggedEntry[] = [];

/**
 * A routing that claims everything and keeps it.
 *
 * The middleware only records what a sink would take, so a routing that claims
 * nothing would leave this file with nothing to read.
 */
const capturing: LogRouting = {
  nodeOf: () => null,
  claims: () => true,
  deliver: (_node, entries) => {
    taken.push(...entries);
    return Promise.resolve();
  },
};

/**
 * Serves `response` at `/brand` through the log middleware, and returns the
 * entry the buffer handed over.
 *
 * The flush is explicit because the buffer lingers a second before publishing
 * on its own, which a test has no reason to wait for.
 */
async function exchange(response: () => Response): Promise<LoggedEntry> {
  taken.length = 0;
  LogRoutes.use(capturing);

  const app = new Hono();
  app.get("/brand", response);
  const served = logger(app);

  const request = new Request("http://host.test/brand");
  await RequestScope.run(request, new Uint8Array(), () => served.fetch(request));
  await logBuffer.flush();

  LogRoutes.reset();
  return taken[0];
}

Deno.test("an exchange that went fine carries its verb and status, and no preview", async () => {
  const entry = await exchange(() => new Response("[]", { status: 200 }));

  assertEquals(entry.metadata, { method: "GET", status: 200 });
  assertEquals(entry.level, "info");
  assertEquals(entry.action, "/brand");
});

Deno.test("a refused exchange carries what the response said", async () => {
  const entry = await exchange(() =>
    new Response('{"error":"no such brand"}', {
      status: 404,
      headers: { "content-type": "application/json" },
    })
  );

  assertEquals(entry.metadata, {
    method: "GET",
    status: 404,
    preview: '{"error":"no such brand"}',
  });
  assertEquals(entry.level, "warn");
});

Deno.test("a secret in a failed body never reaches the entry", async () => {
  const entry = await exchange(() =>
    new Response(JSON.stringify({ apiKey: "sk-live-42", detail: "denied" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    })
  );

  const preview = (entry.metadata as Record<string, string>).preview;

  assertEquals(preview.includes("sk-live-42"), false);
  assertEquals(preview.includes("denied"), true);
});

Deno.test("the client still reads a body the preview has already read", async () => {
  taken.length = 0;
  LogRoutes.use(capturing);

  const app = new Hono();
  app.get("/brand", () => new Response("boom", { status: 500 }));
  const served = logger(app);

  const request = new Request("http://host.test/brand");
  const response = await RequestScope.run(
    request,
    new Uint8Array(),
    () => served.fetch(request),
  );

  assertEquals(await response.text(), "boom");

  // The buffer armed its linger timer on the entry above, and a test that left
  // it armed would be reported as leaking one.
  await logBuffer.flush();
  LogRoutes.reset();
});
