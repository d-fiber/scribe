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

import type { Bootstrapper } from "@scribe/host/boot/lifecycle/bootstrapper.ts";
import { BootSequence } from "@scribe/host/boot/lifecycle/boot_sequence.ts";
import { assertEquals, assertRejects } from "@std/assert";

function recorder(trace: string[], name: string, fails = false): Bootstrapper {
  return {
    name,
    boot() {
      trace.push(`boot:${name}`);
      if (fails) throw new Error(`${name} exploded`);
    },
    shutdown() {
      trace.push(`shutdown:${name}`);
    },
  };
}

Deno.test("BootSequence boots in declaration order", async () => {
  const trace: string[] = [];
  await new BootSequence("test", [
    recorder(trace, "a"),
    recorder(trace, "b"),
    recorder(trace, "c"),
  ]).boot();

  assertEquals(trace, ["boot:a", "boot:b", "boot:c"]);
});

Deno.test("BootSequence shuts down in reverse order", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [
    recorder(trace, "a"),
    recorder(trace, "b"),
  ]);

  await sequence.boot();
  trace.length = 0;
  await sequence.shutdown();

  assertEquals(trace, ["shutdown:b", "shutdown:a"]);
});

Deno.test("BootSequence rolls back what already booted when one fails", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [
    recorder(trace, "a"),
    recorder(trace, "b", true),
    recorder(trace, "c"),
  ]);

  await assertRejects(() => sequence.boot(), Error, "b exploded");

  assertEquals(trace, ["boot:a", "boot:b", "shutdown:a"]);
});

Deno.test("BootSequence shutdown is idempotent", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [recorder(trace, "a")]);

  await sequence.boot();
  await sequence.shutdown();
  await sequence.shutdown();

  assertEquals(trace, ["boot:a", "shutdown:a"]);
});

Deno.test("BootSequence tolerates a bootstrapper without shutdown", async () => {
  const trace: string[] = [];
  const sequence = new BootSequence("test", [
    { name: "bare", boot: () => void trace.push("boot:bare") },
  ]);

  await sequence.boot();
  await sequence.shutdown();

  assertEquals(trace, ["boot:bare"]);
});
