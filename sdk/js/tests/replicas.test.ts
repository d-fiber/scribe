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
import { assertEquals } from "@std/assert";
import { create } from "@bufbuild/protobuf";
import {
  cache,
  Caller,
  Get,
  host,
  NodeRoot,
  PROTOCOL_VERSION,
  type RateLimiter,
  response,
  ScribeServer,
  Time,
  TransportFailure,
  UnaryClient,
  UnaryServer,
} from "../mod.ts";
import { Registration } from "../gen/scribe/protocol/manifest_pb.ts";
import {
  InvocationSchema,
  type Reply,
  RequestSchema,
  Worker as WorkerService,
} from "../gen/scribe/protocol/invocation_pb.ts";
import { Cache } from "../gen/scribe/packages/foundation/protocol/cache_pb.ts";
import { Method as ProtoMethod } from "../gen/scribe/protocol/common_pb.ts";
import { encodeJson } from "../src/contracts/json.ts";

const LIMIT: RateLimiter = { limit: 5, window: Time.minutes(1), penalty: Time.minutes(1) };

const UNKNOWN_TOKEN = "The capability token is unknown, expired or already revoked.";

class AppNode extends NodeRoot {
  protected override access(): Caller {
    return Caller.Anonymous;
  }

  protected override rateLimit(): RateLimiter {
    return LIMIT;
  }
}

class ReadCached extends Get {
  protected override async run(): Promise<Response> {
    return response.ok({ data: { value: await cache.get<string>("brands", "42") } });
  }
}

const worker = new ScribeServer({
  routes: [
    {
      node: "app",
      path: "/cached",
      file: "lib/src/app/cached.ts",
      module: { ReadCached },
      branches: [],
    },
  ],
  nodes: [{ name: "app", public: true, root: new AppNode() }],
});

interface Replica {
  readonly name: string;
  readonly endpoint: string;
  readonly token: string;
  readonly seen: string[];
  shutdown(): Promise<void>;
}

function replicaNamed(name: string): Replica {
  const seen: string[] = [];
  const token = `token-of-${name}`;

  const server = new UnaryServer().on(Cache.method.get, (_key, call) => {
    seen.push(call.capabilityToken);
    if (call.capabilityToken !== token) throw new TransportFailure("unauthorized", UNKNOWN_TOKEN, 401);
    return { hit: true, value: encodeJson(name) };
  });

  const listener = Deno.serve({ port: 0, onListen: () => {} }, (request) => server.handle(request));

  return {
    name,
    endpoint: `http://127.0.0.1:${(listener.addr as Deno.NetAddr).port}`,
    token,
    seen,
    shutdown: () => listener.shutdown(),
  };
}

function channelOf(replica: Replica, workerEndpoint: string): UnaryClient {
  return new UnaryClient(workerEndpoint, () => ({
    capabilityToken: replica.token,
    traceId: `trace-of-${replica.name}`,
    hostEndpoint: replica.endpoint,
  }));
}

async function withReplicas(
  run: (invoke: (replica: Replica) => Promise<Reply>, replicas: readonly Replica[]) => Promise<void>,
): Promise<void> {
  const listener = Deno.serve({ port: 0, onListen: () => {} }, worker.handler());
  const workerEndpoint = `http://127.0.0.1:${(listener.addr as Deno.NetAddr).port}`;
  const replicas = [replicaNamed("first"), replicaNamed("second"), replicaNamed("third")];

  for (const replica of replicas) {
    await channelOf(replica, workerEndpoint).call(Registration.method.describe, {
      hostProtocolVersion: PROTOCOL_VERSION,
      hostEndpoint: replica.endpoint,
      capabilityToken: replica.token,
    });
  }

  const invoke = (replica: Replica) =>
    channelOf(replica, workerEndpoint).call(
      WorkerService.method.invoke,
      create(InvocationSchema, {
        invocationId: `inv-of-${replica.name}`,
        routeId: "app:get:/cached",
        capabilityToken: replica.token,
        request: create(RequestSchema, { method: ProtoMethod.GET, path: "/cached" }),
      }),
    );

  try {
    await run(invoke, replicas);
  } finally {
    host.disconnect();
    await Promise.all([listener.shutdown(), ...replicas.map((replica) => replica.shutdown())]);
  }
}

Scribe.test("a capability call goes back to the replica that invoked, not the last one that attached", async () => {
  await withReplicas(async (invoke, replicas) => {
    const [first, second, third] = replicas;

    const reply = await invoke(first);

    assertEquals(reply.failure?.message, undefined, "the token of the invoking replica was presented elsewhere");
    assertEquals(first.seen, [first.token], "the replica that minted the token never saw the call");
    assertEquals(second.seen, [], "a replica was called back for an invocation it never made");
    assertEquals(third.seen, [], "a replica was called back for an invocation it never made");
  });
});

Scribe.test("every attached replica answers its own invocations, whatever order they attached in", async () => {
  await withReplicas(async (invoke, replicas) => {
    for (const replica of replicas) {
      const reply = await invoke(replica);
      assertEquals(reply.failure?.message, undefined, `${replica.name} was not called back for its own invocation`);
    }

    assertEquals(
      replicas.map((replica) => replica.seen),
      replicas.map((replica) => [replica.token]),
    );
  });
});
