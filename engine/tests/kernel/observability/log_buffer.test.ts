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

import type { LoggedEntry } from "@scribe/alchemy/observe";
import { LogBuffer } from "@scribe/core/kernel/observability/log_buffer.ts";
import { assert, assertEquals } from "@std/assert";

const MAX_BUFFERED = 500;

function entry(action: string, node: string | null = null): LoggedEntry {
  return {
    actorType: null,
    actorId: null,
    traceId: null,
    invocationId: null,
    level: "info",
    action,
    node,
    metadata: {},
    timestamp: 0,
  };
}

interface Published {
  readonly node: string | null;
  readonly entries: readonly LoggedEntry[];
}

function recorder(): { buffer: LogBuffer; batches: Published[] } {
  const batches: Published[] = [];
  const buffer = new LogBuffer((node, entries) => {
    batches.push({ node, entries });
    return Promise.resolve();
  });

  return { buffer, batches };
}

Deno.test("a recorded entry waits instead of buying a publish of its own", async () => {
  const { buffer, batches } = recorder();

  assertEquals(buffer.record(entry("/a")), null, "one entry is not worth a round trip");
  assertEquals(batches.length, 0);
  assertEquals(buffer.pending, 1);

  await buffer.flush();
});

Deno.test("a whole burst leaves as one message, not as one message each", async () => {
  const { buffer, batches } = recorder();

  for (let i = 0; i < 50; i++) buffer.record(entry(`/r${i}`));
  await buffer.flush();

  assertEquals(batches.length, 1, "fifty requests must cost one publish");
  assertEquals(batches[0].entries.length, 50);
  assertEquals(batches[0].entries[0].action, "/r0");
  assertEquals(batches[0].entries[49].action, "/r49");
});

Deno.test("the buffer publishes rather than grows once it is full", async () => {
  const { buffer, batches } = recorder();

  let published: Promise<void> | null = null;
  for (let i = 0; i < MAX_BUFFERED; i++) published = buffer.record(entry(`/r${i}`));

  assert(published, "the entry that fills the batch hands its publish back to be awaited");
  await published;

  assertEquals(batches.length, 1);
  assertEquals(batches[0].entries.length, MAX_BUFFERED);
  assertEquals(buffer.pending, 0, "a full buffer must empty itself, not keep growing");
});

Deno.test("a lone entry is published on the linger, without anybody asking", async () => {
  const { buffer, batches } = recorder();

  buffer.record(entry("/quiet"));
  await new Promise((resolve) => setTimeout(resolve, 1_200));

  assertEquals(batches.length, 1, "an entry on a quiet host must not wait for the next request");
  assertEquals(batches[0].entries[0].action, "/quiet");
  assertEquals(buffer.pending, 0);
});

Deno.test("two nodes never end up in the same batch", async () => {
  const { buffer, batches } = recorder();

  buffer.record(entry("/app/a", "app"));
  buffer.record(entry("/admin/b", "admin"));
  buffer.record(entry("/app/c", "app"));
  buffer.record(entry("/queue/drain"));
  await buffer.flush();

  assertEquals(batches.length, 3, "one publish per node, and one for what belongs to none");

  const app = batches.find((batch) => batch.node === "app");
  assertEquals(app?.entries.map((e) => e.action), ["/app/a", "/app/c"]);

  const admin = batches.find((batch) => batch.node === "admin");
  assertEquals(admin?.entries.map((e) => e.action), ["/admin/b"]);

  const none = batches.find((batch) => batch.node === null);
  assertEquals(
    none?.entries.map((e) => e.action),
    ["/queue/drain"],
    "an entry of no node cannot be handed to a node's sink",
  );
});

Deno.test("one node failing to publish does not take the others down", async () => {
  const delivered: (string | null)[] = [];
  const buffer = new LogBuffer((node) => {
    delivered.push(node);
    return node === "app" ? Promise.reject(new Error("the sink is down")) : Promise.resolve();
  });

  buffer.record(entry("/app/a", "app"));
  buffer.record(entry("/admin/b", "admin"));
  await buffer.flush();

  assertEquals(delivered.length, 2, "admin must still be attempted after app threw");
  assertEquals(buffer.pending, 0);
});

Deno.test("flushing twice does not publish an empty batch", async () => {
  const { buffer, batches } = recorder();

  buffer.record(entry("/a"));
  await buffer.flush();
  await buffer.flush();

  assertEquals(batches.length, 1);
});

Deno.test("a publish that fails drops its batch instead of holding it for the next one", async () => {
  let attempts = 0;
  const buffer = new LogBuffer(() => {
    attempts++;
    return Promise.reject(new Error("nats is down"));
  });

  buffer.record(entry("/a"));
  await buffer.flush();

  assertEquals(attempts, 1);
  assertEquals(buffer.pending, 0, "keeping a failed batch grows the buffer for as long as the outage lasts");

  buffer.record(entry("/b"));
  await buffer.flush();

  assertEquals(attempts, 2, "the next batch must still be attempted");
});

Deno.test("a flush disarms the linger, so the timer never fires on an empty buffer", async () => {
  const { buffer, batches } = recorder();

  buffer.record(entry("/a"));
  await buffer.flush();
  await new Promise((resolve) => setTimeout(resolve, 1_200));

  assertEquals(batches.length, 1, "the armed timer must have been cleared by the flush");
});
