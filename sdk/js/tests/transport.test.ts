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

import { assertEquals, assertRejects } from "@std/assert";
import { create, fromBinary } from "@bufbuild/protobuf";
import {
  Caller,
  Get,
  NodeRoot,
  PROTOCOL_VERSION,
  type RateLimiter,
  response,
  ScribeServer,
  Time,
  TransportFailure,
  UnaryClient,
} from "../mod.ts";
import { Registration } from "../gen/scribe/protocol/manifest_pb.ts";
import { InvocationSchema, RequestSchema, Worker as WorkerService } from "../gen/scribe/protocol/invocation_pb.ts";
import { FailureSchema, Method as ProtoMethod } from "../gen/scribe/protocol/common_pb.ts";

const LIMIT: RateLimiter = { limit: 5, window: Time.minutes(1), penalty: Time.minutes(1) };

const decoder = new TextDecoder();

class AppNode extends NodeRoot {
  protected override access(): Caller {
    return Caller.Anonymous;
  }

  protected override rateLimit(): RateLimiter {
    return LIMIT;
  }
}

class Ping extends Get {
  protected override run(): Response {
    return response.ok({ data: { pong: true } });
  }
}

const server = new ScribeServer({
  routes: [
    {
      node: "app",
      path: "/ping",
      file: "lib/src/app/ping.ts",
      module: { Ping },
      branches: [],
    },
  ],
  nodes: [{ name: "app", public: true, root: new AppNode() }],
});

async function withWorker(run: (client: UnaryClient) => Promise<void>): Promise<void> {
  const listener = Deno.serve({ port: 0, onListen: () => {} }, server.handler());
  const endpoint = `http://127.0.0.1:${(listener.addr as Deno.NetAddr).port}`;
  const client = new UnaryClient(endpoint, () => ({
    capabilityToken: "token-1",
    traceId: "trace-1",
    hostEndpoint: "http://127.0.0.1:1",
  }));

  try {
    await run(client);
  } finally {
    await listener.shutdown();
  }
}

Deno.test("the host discovers the worker by asking for its manifest", async () => {
  await withWorker(async (client) => {
    const manifest = await client.call(Registration.method.describe, {
      hostProtocolVersion: PROTOCOL_VERSION,
      hostEndpoint: "http://127.0.0.1:1",
      capabilityToken: "bootstrap",
    });

    assertEquals(manifest.protocolVersion, PROTOCOL_VERSION);
    assertEquals(manifest.workerLanguage, "js");
    assertEquals(manifest.nodes.map((node) => node.name), ["app"]);
    assertEquals(manifest.routes.map((route) => route.routeId), ["app:get:/ping"]);
  });
});

Deno.test("a major protocol mismatch is refused at the handshake", async () => {
  await withWorker(async (client) => {
    const failure = await assertRejects(
      () =>
        client.call(Registration.method.describe, {
          hostProtocolVersion: "9.0.0",
          hostEndpoint: "http://127.0.0.1:1",
          capabilityToken: "bootstrap",
        }),
      TransportFailure,
    );

    assertEquals(failure.status, 400);
    assertEquals(failure.code, "bad_request");
  });
});

Deno.test("an invocation crosses the wire and comes back as a reply", async () => {
  await withWorker(async (client) => {
    const reply = await client.call(
      WorkerService.method.invoke,
      create(InvocationSchema, {
        invocationId: "inv-9",
        routeId: "app:get:/ping",
        request: create(RequestSchema, { method: ProtoMethod.GET, path: "/ping" }),
      }),
    );

    assertEquals(reply.status, 200);
    assertEquals(JSON.parse(decoder.decode(reply.body)), { code: "success", data: { pong: true } });
  });
});

Deno.test("an unknown procedure answers a failure, not an empty body", async () => {
  await withWorker(async (client) => {
    const response = await fetch(new URL("/scribe.v1.Nope/Call", client.endpoint), {
      method: "POST",
      body: new Uint8Array(),
    });
    const failure = fromBinary(FailureSchema, new Uint8Array(await response.arrayBuffer()));

    assertEquals(response.status, 404);
    assertEquals(failure.code, "not_found");
  });
});
