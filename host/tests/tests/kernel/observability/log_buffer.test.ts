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

import type { LogEntry } from "@scribe/core/contracts/logging.ts";
import { LogBuffer } from "@scribe/core/kernel/observability/log_buffer.ts";
import { assert, assertEquals } from "@std/assert";

const MAX_BUFFERED = 500;

function entry(action: string): LogEntry {
  return { level: "info", action, metadata: {}, timestamp: 0 };
}

function recorder(): { buffer: LogBuffer; batches: (readonly LogEntry[])[] } {
  const batches: (readonly LogEntry[])[] = [];
  const buffer = new LogBuffer((entries) => {
    batches.push(entries);
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
  assertEquals(batches[0].length, 50);
  assertEquals(batches[0][0].action, "/r0");
  assertEquals(batches[0][49].action, "/r49");
});

Deno.test("the buffer publishes rather than grows once it is full", async () => {
  const { buffer, batches } = recorder();

  let published: Promise<void> | null = null;
  for (let i = 0; i < MAX_BUFFERED; i++) published = buffer.record(entry(`/r${i}`));

  assert(published, "the entry that fills the batch hands its publish back to be awaited");
  await published;

  assertEquals(batches.length, 1);
  assertEquals(batches[0].length, MAX_BUFFERED);
  assertEquals(buffer.pending, 0, "a full buffer must empty itself, not keep growing");
});

Deno.test("a lone entry is published on the linger, without anybody asking", async () => {
  const { buffer, batches } = recorder();

  buffer.record(entry("/quiet"));
  await new Promise((resolve) => setTimeout(resolve, 1_200));

  assertEquals(batches.length, 1, "an entry on a quiet host must not wait for the next request");
  assertEquals(batches[0][0].action, "/quiet");
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
