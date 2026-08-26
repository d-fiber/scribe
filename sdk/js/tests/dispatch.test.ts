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
import { create } from "@bufbuild/protobuf";
import { Caller, type DiscoveredRoute, NodeRoot, Post, type RateLimiter, type RequestContext, response, ScribeServer, Time } from "../mod.ts";
import { invoke } from "../src/runtime/dispatch.ts";
import { IdentitySchema, InvocationSchema, RequestSchema } from "../gen/scribe/protocol/invocation_pb.ts";
import { Caller as ProtoCaller, Method as ProtoMethod } from "../gen/scribe/protocol/common_pb.ts";

const LIMIT: RateLimiter = { limit: 10, window: Time.minutes(1), penalty: Time.minutes(1) };

const encoder = new TextEncoder();

const decoder = new TextDecoder();

class AdminNode extends NodeRoot {
  protected override access(): Caller {
    return Caller.Admin;
  }

  protected override rateLimit(): RateLimiter {
    return LIMIT;
  }
}

class UpdateBrand extends Post {
  protected override run(ctx: RequestContext): Response {
    return response.ok({
      data: {
        brandId: ctx.param("brandId"),
        page: ctx.query("page"),
        actor: ctx.user?.id,
        role: ctx.user?.role,
        name: (ctx.raw() as { name: string }).name,
      },
    });
  }
}

class Boom extends Post {
  protected override run(): Response {
    throw new Error("the database is on fire");
  }
}

function workerWith(routes: readonly DiscoveredRoute[]) {
  return new ScribeServer({ routes, nodes: [{ name: "admin", public: true, root: new AdminNode() }] })
    .definition();
}

function invocationFor(routeId: string, body: unknown = undefined) {
  return create(InvocationSchema, {
    invocationId: "inv-1",
    traceId: "trace-1",
    routeId,
    capabilityToken: "token-1",
    request: create(RequestSchema, {
      method: ProtoMethod.POST,
      path: "/brand/42",
      pathParams: { brandId: "42" },
      query: { page: "2" },
      headers: { "content-type": "application/json" },
      body: body === undefined ? new Uint8Array() : encoder.encode(JSON.stringify(body)),
      ip: "10.0.0.1",
      userAgent: "conformance",
    }),
    identity: create(IdentitySchema, {
      id: "admin-1",
      email: "admin@example.com",
      caller: ProtoCaller.ADMIN,
      rules: { role: "owner", permissions: ["brand:create"] },
    }),
  });
}

Deno.test("an invocation reaches its handler and the response becomes a reply", async () => {
  const worker = workerWith([
    {
      node: "admin",
      path: "/brand/:brandId",
      file: "lib/src/admin/brand/[brandId]/index.ts",
      module: { UpdateBrand },
      branches: [],
    },
  ]);

  const reply = await invoke(worker, invocationFor("admin:post:/brand/:brandId", { name: "Fiber" }));

  assertEquals(reply.status, 200);
  assertEquals(reply.invocationId, "inv-1");
  assertEquals(JSON.parse(decoder.decode(reply.body)), {
    code: "success",
    data: { brandId: "42", page: "2", actor: "admin-1", role: "owner", name: "Fiber" },
  });
});

Deno.test("an unknown route identifier fails loudly instead of guessing", async () => {
  const reply = await invoke(workerWith([]), invocationFor("admin:get:/nope"));

  assertEquals(reply.status, 500);
  assertEquals(reply.failure?.code, "unknown_route");
});

Deno.test("a handler that throws answers a failure the host can log", async () => {
  const worker = workerWith([
    {
      node: "admin",
      path: "/boom",
      file: "lib/src/admin/boom.ts",
      module: { Boom },
      branches: [],
    },
  ]);

  const reply = await invoke(worker, invocationFor("admin:post:/boom"));

  assertEquals(reply.status, 500);
  assertEquals(reply.failure?.code, "handler_failed");
  assertEquals(reply.failure?.message, "the database is on fire");
});
