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
