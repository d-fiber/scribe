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
import type { RequestAuthorizer } from "@scribe/shell/platform/edge/authorization/request_authorizer.ts";
import type { WorkerDispatcher } from "@scribe/shell/platform/edge/dispatch/worker_dispatcher.ts";
import { EdgeFunctionsRuntime } from "@scribe/shell/platform/edge/runtime.ts";
import type { ResolvedService, ServiceResolver } from "@scribe/shell/platform/edge/services/service_resolver.ts";
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

Scribe.test("EdgeFunctionsRuntime dispatches an authorized request to its worker", async () => {
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

Scribe.test("EdgeFunctionsRuntime returns the denial and never dispatches", async () => {
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

Scribe.test("EdgeFunctionsRuntime authorizes before knowing the service exists", async () => {
  const authorizer = new RecordingAuthorizer();
  const runtime = new EdgeFunctionsRuntime({
    resolver: new StaticResolver(null),
    authorizer,
    dispatcher: new RecordingDispatcher(),
  });

  await runtime.handle(request());

  assertEquals(authorizer.services, [""]);
});

Scribe.test("EdgeFunctionsRuntime answers missing_function_name when nothing resolves", async () => {
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

Scribe.test("EdgeFunctionsRuntime turns a collaborator failure into a 500", async () => {
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
