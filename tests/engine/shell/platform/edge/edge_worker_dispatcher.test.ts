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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import { EdgeWorkerDispatcher } from "@scribe/shell/platform/edge/dispatch/edge_worker_dispatcher.ts";
import type { EdgePlatform, EdgeWorker, EdgeWorkerOptions } from "@scribe/shell/platform/edge/platform.ts";
import { MAX_BODY_BYTES } from "@scribe/runtime/http/limits.ts";
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

Scribe.test("EdgeWorkerDispatcher passes the configured limits to the platform", async () => {
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

Scribe.test("EdgeWorkerDispatcher stamps x-request-start and tags the request", async () => {
  const platform = new FakePlatform();

  await dispatcher(platform).dispatch(
    new Request("http://localhost/app", { headers: { "x-custom": "kept" } }),
    "/functions/app",
  );

  assert(platform.received?.headers.get("x-request-start"));
  assertEquals(platform.received?.headers.get("x-custom"), "kept");
  assertEquals(platform.tagged, 1);
});

Scribe.test("EdgeWorkerDispatcher forwards the body of a write request", async () => {
  const platform = new FakePlatform();

  await dispatcher(platform).dispatch(
    new Request("http://localhost/app", { method: "POST", body: "payload" }),
    "/functions/app",
  );

  assertEquals(platform.received?.method, "POST");
  assertEquals(await platform.received!.text(), "payload");
});

Scribe.test("EdgeWorkerDispatcher sends no body on GET and HEAD", async () => {
  for (const method of ["GET", "HEAD"]) {
    const platform = new FakePlatform();

    await dispatcher(platform).dispatch(
      new Request("http://localhost/app", { method }),
      "/functions/app",
    );

    assertEquals(platform.received?.body, null, method);
  }
});

Scribe.test("EdgeWorkerDispatcher turns a platform failure into a 500", async () => {
  const response = await dispatcher(new FakePlatform(true)).dispatch(
    new Request("http://localhost/app"),
    "/functions/app",
  );
  const body = (await response.json()) as { code: string };

  assertEquals(response.status, 500);
  assertEquals(body.code, "internal_error");
});

Scribe.test("EdgeWorkerDispatcher hands the platform the environment it was built with", async () => {
  const platform = new FakePlatform();
  const envVars = [["A", "1"], ["B", "2"]];

  await new EdgeWorkerDispatcher(platform, LIMITS, envVars).dispatch(
    new Request("http://localhost/app"),
    "/functions/app",
  );

  assertEquals(platform.options?.envVars, envVars);
});

Scribe.test("EdgeWorkerDispatcher reads the environment once, not per dispatch", async () => {
  const platform = new FakePlatform();
  const subject = new EdgeWorkerDispatcher(platform, LIMITS);

  await subject.dispatch(new Request("http://localhost/app"), "/functions/app");
  const first = platform.options?.envVars;

  Deno.env.set("SCRIBE_DISPATCH_PROBE", "late");
  try {
    await subject.dispatch(
      new Request("http://localhost/app"),
      "/functions/app",
    );

    assertEquals(platform.options?.envVars, first);
  } finally {
    Deno.env.delete("SCRIBE_DISPATCH_PROBE");
  }
});

Scribe.test("EdgeWorkerDispatcher hands the isolate none of the framework's own secrets", async () => {
  const platform = new FakePlatform();
  const environment = [
    ["JWT_SECRET", "the-signing-secret"],
    ["SERVICE_KEY", "the-service-role-key"],
    ["INTERNAL_SECRET", "the-internal-secret"],
    ["DEVICE_PAYLOAD_PRIVATE_KEY", "00112233"],
    ["REDIS_URL", "redis://:password@cache:6379"],
    ["STRIPE_SECRET_KEY", "what the project configured for itself"],
  ];

  await new EdgeWorkerDispatcher(platform, LIMITS, environment).dispatch(
    new Request("http://localhost/app"),
    "/functions/app",
  );

  const handed = new Set((platform.options?.envVars ?? []).map((pair) => pair[0]));

  assertEquals(
    [...handed],
    ["STRIPE_SECRET_KEY"],
    "a worker is handed the identity already resolved and reaches the rest through a capability, so the credentials of the deployment are not its business",
  );
});

Scribe.test("EdgeWorkerDispatcher keeps a project's own variables, whatever they are named", async () => {
  const platform = new FakePlatform();

  await new EdgeWorkerDispatcher(platform, LIMITS, [["MY_API_KEY", "kept"]]).dispatch(
    new Request("http://localhost/app"),
    "/functions/app",
  );

  assertEquals(
    platform.options?.envVars,
    [["MY_API_KEY", "kept"]],
    "which variables a project needs is not something this framework can know, so it withholds only its own",
  );
});

Scribe.test("EdgeWorkerDispatcher withholds the header that proves an internal call", async () => {
  const platform = new FakePlatform();

  await dispatcher(platform).dispatch(
    new Request("http://localhost/app", {
      headers: { "authorization": "Bearer caller", "x-internal-secret": "the-internal-secret" },
    }),
    "/functions/app",
  );

  assertEquals(
    platform.received?.headers.get("x-internal-secret"),
    null,
    "a function that echoed it would hand any caller the service role everywhere",
  );
  assertEquals(
    platform.received?.headers.get("authorization"),
    "Bearer caller",
    "the worker is the endpoint here, so what it is answering travels on",
  );
});

Scribe.test("EdgeWorkerDispatcher refuses a body past the ceiling, and buys no isolate with it", async () => {
  const platform = new FakePlatform();
  const overrun = new ReadableStream({
    start(controller) {
      for (let chunk = 0; chunk <= MAX_BODY_BYTES / (1024 * 1024); chunk++) {
        controller.enqueue(new Uint8Array(1024 * 1024));
      }
      controller.close();
    },
  });

  const answer = await dispatcher(platform).dispatch(
    new Request("http://localhost/app", { method: "POST", body: overrun }),
    "/functions/app",
  );

  assertEquals(answer.status, 413);
  assertEquals(
    platform.options,
    null,
    "nothing on this path is the admission control of the other process, so a refused body must not have cost an isolate first",
  );
});
