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

import { Semaphore } from "@scribe/core/runtime/support/async/semaphore.ts";
import { sleep } from "@scribe/core/runtime/support/async/sleep.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("Semaphore lets through up to its limit without waiting", async () => {
  const gate = new Semaphore(3);

  await gate.acquire();
  await gate.acquire();
  await gate.acquire();

  assertEquals(gate.inFlight, 3);
  assertEquals(gate.waiting, 0);
});

Deno.test("Semaphore queues the callers past its limit", async () => {
  const gate = new Semaphore(1);
  await gate.acquire();

  let admitted = false;
  const pending = gate.acquire().then(() => {
    admitted = true;
  });

  await sleep(1);
  assertEquals(admitted, false);
  assertEquals(gate.waiting, 1);

  gate.release();
  await pending;
  assert(admitted);
});

Deno.test("Semaphore treats a limit below one as one", async () => {
  const gate = new Semaphore(0);
  await gate.acquire();

  assertEquals(gate.inFlight, 1);
});

Deno.test("Semaphore.run never lets the peak exceed the limit", async () => {
  const gate = new Semaphore(2);
  let inFlight = 0;
  let peak = 0;

  await Promise.all(
    Array.from({ length: 12 }, () =>
      gate.run(async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await sleep(1);
        inFlight--;
      })),
  );

  assert(peak <= 2, `peak was ${peak}`);
});

Deno.test("Semaphore.run releases its slot even when the call throws", async () => {
  const gate = new Semaphore(1);

  await gate.run(() => Promise.reject(new Error("boom"))).catch(() => {});

  assertEquals(gate.inFlight, 0);
  await gate.acquire();
  assertEquals(gate.inFlight, 1);
});

Deno.test("Semaphore.release never drives the counter below zero", () => {
  const gate = new Semaphore(2);

  gate.release();
  gate.release();

  assertEquals(gate.inFlight, 0);
});
