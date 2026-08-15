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

import { EdgeWorkerDispatcher } from "@scribe/host/boot/edge/dispatch/edge_worker_dispatcher.ts";
import type {
  EdgePlatform,
  EdgeWorker,
  EdgeWorkerOptions,
} from "@scribe/host/boot/edge/platform.ts";
import { assert, assertEquals } from "@std/assert";

const LIMITS = {
  memoryLimitMb: 150,
  workerTimeoutMs: 60_000,
  importMapPath: "/home/deno/functions/deno.json",
};

class FakePlatform implements EdgePlatform {
  options: EdgeWorkerOptions | null = null;
  received: Request | null = null;
  tagged = 0;

  constructor(private readonly failing = false) {}

  createWorker(options: EdgeWorkerOptions): Promise<EdgeWorker> {
    if (this.failing) return Promise.reject(new Error("no worker slot"));
    this.options = options;
    return Promise.resolve({
      fetch: (request: Request) => {
        this.received = request;
        return Promise.resolve(new Response("ok", { status: 200 }));
      },
    });
  }

  tagRequest(): void {
    this.tagged++;
  }
}

function dispatcher(platform: EdgePlatform) {
  return new EdgeWorkerDispatcher(platform, LIMITS);
}

Deno.test("EdgeWorkerDispatcher passes the configured limits to the platform", async () => {
  const platform = new FakePlatform();

  await dispatcher(platform).dispatch(
    new Request("http://localhost/app"),
    "/functions/app",
  );

  assertEquals(platform.options?.servicePath, "/functions/app");
  assertEquals(platform.options?.memoryLimitMb, 150);
  assertEquals(platform.options?.workerTimeoutMs, 60_000);
  assertEquals(platform.options?.importMapPath, LIMITS.importMapPath);
  assertEquals(platform.options?.noModuleCache, false);
});

Deno.test("EdgeWorkerDispatcher stamps x-request-start and tags the request", async () => {
  const platform = new FakePlatform();

  await dispatcher(platform).dispatch(
    new Request("http://localhost/app", { headers: { "x-custom": "kept" } }),
    "/functions/app",
  );

  assert(platform.received?.headers.get("x-request-start"));
  assertEquals(platform.received?.headers.get("x-custom"), "kept");
  assertEquals(platform.tagged, 1);
});

Deno.test("EdgeWorkerDispatcher forwards the body of a write request", async () => {
  const platform = new FakePlatform();

  await dispatcher(platform).dispatch(
    new Request("http://localhost/app", { method: "POST", body: "payload" }),
    "/functions/app",
  );

  assertEquals(platform.received?.method, "POST");
  assertEquals(await platform.received!.text(), "payload");
});

Deno.test("EdgeWorkerDispatcher sends no body on GET and HEAD", async () => {
  for (const method of ["GET", "HEAD"]) {
    const platform = new FakePlatform();

    await dispatcher(platform).dispatch(
      new Request("http://localhost/app", { method }),
      "/functions/app",
    );

    assertEquals(platform.received?.body, null, method);
  }
});

Deno.test("EdgeWorkerDispatcher turns a platform failure into a 500", async () => {
  const response = await dispatcher(new FakePlatform(true)).dispatch(
    new Request("http://localhost/app"),
    "/functions/app",
  );
  const body = (await response.json()) as { code: string };

  assertEquals(response.status, 500);
  assertEquals(body.code, "internal_error");
});
