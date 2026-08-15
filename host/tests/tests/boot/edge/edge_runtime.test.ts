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

import type { RequestAuthorizer } from "@scribe/host/boot/edge/authorization/request_authorizer.ts";
import type { WorkerDispatcher } from "@scribe/host/boot/edge/dispatch/worker_dispatcher.ts";
import { EdgeFunctionsRuntime } from "@scribe/host/boot/edge/edge_runtime.ts";
import type {
  ResolvedService,
  ServiceResolver,
} from "@scribe/host/boot/edge/services/service_resolver.ts";
import { assertEquals } from "@std/assert";

class StaticResolver implements ServiceResolver {
  constructor(private readonly resolved: ResolvedService | null) {}

  resolve(): Promise<ResolvedService | null> {
    return Promise.resolve(this.resolved);
  }
}

class RecordingAuthorizer implements RequestAuthorizer {
  readonly services: string[] = [];

  constructor(private readonly denial: Response | null = null) {}

  authorize(_request: Request, service: string): Promise<Response | null> {
    this.services.push(service);
    return Promise.resolve(this.denial);
  }
}

class RecordingDispatcher implements WorkerDispatcher {
  readonly paths: string[] = [];

  dispatch(_request: Request, servicePath: string): Promise<Response> {
    this.paths.push(servicePath);
    return Promise.resolve(new Response("dispatched", { status: 200 }));
  }
}

const SERVICE: ResolvedService = {
  service: "public/admin",
  servicePath: "/home/deno/functions/api/public/admin",
};

function request() {
  return new Request("http://localhost/public/admin/team");
}

Deno.test("EdgeFunctionsRuntime dispatches an authorized request to its worker", async () => {
  const dispatcher = new RecordingDispatcher();
  const runtime = new EdgeFunctionsRuntime({
    resolver: new StaticResolver(SERVICE),
    authorizer: new RecordingAuthorizer(),
    dispatcher,
  });

  const response = await runtime.handle(request());

  assertEquals(response.status, 200);
  assertEquals(dispatcher.paths, [SERVICE.servicePath]);
});

Deno.test("EdgeFunctionsRuntime returns the denial and never dispatches", async () => {
  const dispatcher = new RecordingDispatcher();
  const runtime = new EdgeFunctionsRuntime({
    resolver: new StaticResolver(SERVICE),
    authorizer: new RecordingAuthorizer(
      new Response("nope", { status: 401 }),
    ),
    dispatcher,
  });

  const response = await runtime.handle(request());

  assertEquals(response.status, 401);
  assertEquals(dispatcher.paths, []);
});

Deno.test("EdgeFunctionsRuntime authorizes before knowing the service exists", async () => {
  const authorizer = new RecordingAuthorizer();
  const runtime = new EdgeFunctionsRuntime({
    resolver: new StaticResolver(null),
    authorizer,
    dispatcher: new RecordingDispatcher(),
  });

  await runtime.handle(request());

  assertEquals(authorizer.services, [""]);
});

Deno.test("EdgeFunctionsRuntime answers missing_function_name when nothing resolves", async () => {
  const runtime = new EdgeFunctionsRuntime({
    resolver: new StaticResolver(null),
    authorizer: new RecordingAuthorizer(),
    dispatcher: new RecordingDispatcher(),
  });

  const response = await runtime.handle(request());
  const body = (await response.json()) as { code: string };

  assertEquals(response.status, 400);
  assertEquals(body.code, "missing_function_name");
});

Deno.test("EdgeFunctionsRuntime turns a collaborator failure into a 500", async () => {
  const runtime = new EdgeFunctionsRuntime({
    resolver: {
      resolve: () => Promise.reject(new Error("disk on fire")),
    },
    authorizer: new RecordingAuthorizer(),
    dispatcher: new RecordingDispatcher(),
  });

  const response = await runtime.handle(request());

  assertEquals(response.status, 500);
});
