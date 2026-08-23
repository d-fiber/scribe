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
import { type DiscoveredLogSink, LogSink, Node, ScribeServer } from "@scribe/sdk";
import type { Manifest } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import type { LoggedEntry } from "@scribe/alchemy/observe";
import { WorkerLogSinks } from "@scribe/host/project/worker/log_sinks.ts";
import { WorkerClient } from "@scribe/host/project/worker/worker_client.ts";

/**
 * What the project's sinks were handed, in order.
 *
 * The worker builds a sink itself, from the class a `_log.ts` exports, so the
 * test cannot hold the instance it wants to read. The sinks write here instead,
 * under the name of the file they stand for.
 */
const delivered: { sink: string; entries: readonly LoggedEntry[] }[] = [];

/** Stands for `lib/_log.ts`. */
class ProjectLogs extends LogSink {
  // Zero, so a delivery is handed over as it arrives: this file checks what
  // crosses the worker boundary, not how a sink gathers what it took.
  protected override blockSize(): number {
    return 0;
  }

  protected override block(entries: readonly LoggedEntry[]): void {
    delivered.push({ sink: "root", entries });
  }
}

/** Stands for `lib/src/app/_log.ts`. */
class AppLogs extends LogSink {
  protected override blockSize(): number {
    return 0;
  }

  protected override block(entries: readonly LoggedEntry[]): void {
    delivered.push({ sink: "app", entries });
  }
}

const ROOT_SINK: DiscoveredLogSink = { node: null, file: "lib/_log.ts", module: { ProjectLogs } };

const APP_SINK: DiscoveredLogSink = {
  node: "app",
  file: "lib/src/app/_log.ts",
  module: { AppLogs },
};

function entry(action: string, node: string | null): LoggedEntry {
  return {
    actorType: null,
    actorId: null,
    traceId: null,
    invocationId: null,
    level: "info",
    action,
    node,
    metadata: { method: "GET", status: 200 },
    timestamp: 1,
  };
}

/**
 * A worker of two nodes, attached the way the host attaches one.
 *
 * The client answers in this process, so a delivery really crosses
 * `LogDispatch.Handle` rather than being handed to the sink directly.
 */
async function attach(
  logSinks: readonly DiscoveredLogSink[],
): Promise<{ sinks: WorkerLogSinks; manifest: Manifest }> {
  delivered.length = 0;

  const server = new ScribeServer({ routes: [], logSinks })
    .addNode(new Node({ name: "app", public: true }))
    .addNode(new Node({ name: "admin", public: false }));

  const client = new WorkerClient("http://worker.test", server.handler());
  const manifest = await client.describe("http://127.0.0.1:1", "bootstrap");

  return { sinks: new WorkerLogSinks(client, manifest), manifest };
}

Deno.test("the node of an entry is the first segment, when it names a node", async () => {
  const { sinks } = await attach([ROOT_SINK, APP_SINK]);

  assertEquals(sinks.nodeOf("/app/brand/42"), "app");
  assertEquals(sinks.nodeOf("/admin"), "admin");
  assertEquals(sinks.nodeOf("/health"), null);
  assertEquals(sinks.nodeOf("/"), null);
  assertEquals(sinks.nodeOf(""), null);
});

Deno.test("a node is claimed by its own sink, and by the root one otherwise", async () => {
  const { sinks } = await attach([ROOT_SINK, APP_SINK]);

  assertEquals(sinks.claims("app"), true);
  assertEquals(sinks.claims("admin"), true);
  assertEquals(sinks.claims(null), true);
});

Deno.test("without a root _log.ts, only the nodes that declared one are claimed", async () => {
  const { sinks } = await attach([APP_SINK]);

  assertEquals(sinks.claims("app"), true);
  assertEquals(sinks.claims("admin"), false);
  assertEquals(sinks.claims(null), false);
});

Deno.test("a project that declared nothing claims nothing", async () => {
  const { sinks, manifest } = await attach([]);

  assertEquals(manifest.rootLogSink, false);
  assertEquals(sinks.claims("app"), false);
  assertEquals(sinks.claims(null), false);
});

Deno.test("a node's entries cross to that node's sink", async () => {
  const { sinks } = await attach([ROOT_SINK, APP_SINK]);

  await sinks.deliver("app", [entry("GET /brand", "app")]);

  assertEquals(delivered.map((batch) => batch.sink), ["app"]);
  assertEquals(delivered[0].entries.map((held) => [held.action, held.node]), [[
    "GET /brand",
    "app",
  ]]);
});

Deno.test("a node with no sink of its own crosses to the root one", async () => {
  const { sinks } = await attach([ROOT_SINK, APP_SINK]);

  await sinks.deliver("admin", [entry("GET /secret", "admin")]);

  assertEquals(delivered.map((batch) => batch.sink), ["root"]);
  assertEquals(delivered[0].entries[0].action, "GET /secret");
});

Deno.test("what belongs to no node crosses to the root sink", async () => {
  const { sinks } = await attach([ROOT_SINK, APP_SINK]);

  await sinks.deliver(null, [entry("GET /health", null)]);

  assertEquals(delivered.map((batch) => batch.sink), ["root"]);
  assertEquals(delivered[0].entries[0].node, null);
});

Deno.test("the metadata of an exchange survives the crossing", async () => {
  const { sinks } = await attach([ROOT_SINK]);

  await sinks.deliver(null, [entry("GET /health", null)]);

  assertEquals(delivered[0].entries[0].metadata, { method: "GET", status: 200 });
  assertEquals(delivered[0].entries[0].level, "info");
});

Deno.test("the preview of a failed response crosses with the rest of the metadata", async () => {
  const { sinks } = await attach([ROOT_SINK]);
  const failed: LoggedEntry = {
    level: "warn",
    action: "/brand",
    node: null,
    actorType: null,
    actorId: null,
    traceId: null,
    invocationId: null,
    metadata: { method: "GET", status: 404, preview: '{"error":"no such brand"}' },
    timestamp: 1,
  };

  await sinks.deliver(null, [failed]);

  assertEquals(delivered[0].entries[0].metadata, {
    method: "GET",
    status: 404,
    preview: '{"error":"no such brand"}',
  });
});
