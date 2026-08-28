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
import {
  Caller,
  type DiscoveredRoute,
  Get,
  NodeRoot,
  PROTOCOL_VERSION,
  type RateLimiter,
  type RequestContext,
  response,
  ScribeServer,
  Time,
} from "@scribe/sdk";
import { HOST_HEADER } from "@scribe/sdk/src/transport/wire.ts";
import { installRateLimiterMock } from "@scribe/foundation/testing";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { mountManifest } from "@scribe/embedder/control/mount.ts";
import { WorkerClient } from "@scribe/embedder/control/client.ts";

const LIMIT: RateLimiter = { limit: 100, window: Time.minutes(1), penalty: Time.minutes(1) };

class AppNode extends NodeRoot {
  protected override access(): Caller {
    return Caller.Anonymous;
  }

  protected override rateLimit(): RateLimiter {
    return LIMIT;
  }
}

class AdminNode extends NodeRoot {
  protected override access(): Caller {
    return Caller.Admin;
  }

  protected override rateLimit(): RateLimiter {
    return LIMIT;
  }
}

class ReadBrand extends Get {
  protected override run(ctx: RequestContext): Response {
    return response.ok({
      data: { brandId: ctx.param("brandId"), page: ctx.query("page"), agent: ctx.userAgent },
    });
  }
}

class ReadSecret extends Get {
  protected override run(): Response {
    return response.ok();
  }
}

const discovered: readonly DiscoveredRoute[] = [
  {
    node: "app",
    path: "/brand/:brandId",
    file: "lib/src/app/brand/[brandId]/index.ts",
    module: { ReadBrand },
    branches: [],
  },
  {
    node: "admin",
    path: "/secret",
    file: "lib/src/admin/secret.ts",
    module: { ReadSecret },
    branches: [],
  },
];

const server = new ScribeServer({
  routes: discovered,
  nodes: [{ name: "app", public: true, root: new AppNode() }, { name: "admin", public: true, root: new AdminNode() }],
});

const handler = server.handler();

const CALLBACK = "http://replica.test:4747";

async function withAttachedWorker(
  run: (surfaces: { admin: Hono; app: Hono }, announced: readonly string[]) => Promise<void>,
): Promise<void> {
  const announced: string[] = [];
  const client = new WorkerClient("http://worker.test", CALLBACK, (request) => {
    announced.push(request.headers.get(HOST_HEADER) ?? "");
    return handler(request);
  });
  const limiter = installRateLimiterMock();

  const surfaces = { admin: new Hono(), app: new Hono() };
  const manifest = await client.describe("bootstrap");
  const mounted = mountManifest(
    (node) => (node.name === "admin" ? surfaces.admin : surfaces.app),
    manifest,
    client,
  );

  assertEquals(manifest.protocolVersion, PROTOCOL_VERSION);
  assertEquals(manifest.nodes.map((node) => node.name), ["app", "admin"]);
  assertEquals(mounted, 2);

  try {
    await run(surfaces, announced);
  } finally {
    limiter.restore();
  }
}

function call(app: Hono, path: string): Promise<Response> {
  const request = new Request(`https://api.example.com${path}`, {
    headers: { "user-agent": "conformance" },
  });

  return RequestScope.run(
    request,
    new Uint8Array(),
    () => Promise.resolve(app.fetch(request)),
  );
}

Deno.test("a route discovered on the worker tree answers through the host", async () => {
  await withAttachedWorker(async (surfaces) => {
    const response = await call(surfaces.app, "/brand/42?page=2");

    assertEquals(response.status, 200);
    assertEquals(await response.json(), {
      code: "success",
      data: { brandId: "42", page: "2", agent: "conformance" },
    });
  });
});

Deno.test("every call the host makes names the replica that made it", async () => {
  await withAttachedWorker(async (surfaces, announced) => {
    const response = await call(surfaces.app, "/brand/42?page=2");

    assertEquals(response.status, 200);
    assertEquals(
      announced,
      [CALLBACK, CALLBACK],
      "a grant is redeemable at the replica that minted it and nowhere else, so every call has to name it",
    );
  });
});

Deno.test("the host refuses an unauthenticated caller before the worker is invoked", async () => {
  await withAttachedWorker(async (surfaces) => {
    const response = await call(surfaces.admin, "/secret");

    assertEquals(response.status, 401);
    assertEquals((await response.json()).code, "unauthorized");
  });
});
