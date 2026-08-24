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

import { equals, expect, isTrue } from "@scribe/engine/alchemy/test/mod.ts";
import { Duration, Future, Semaphore } from "@scribe/engine/alchemy/mod.ts";

Deno.test("Semaphore lets through up to its limit without waiting", async () => {
  const gate = new Semaphore(3);

  await gate.acquire();
  await gate.acquire();
  await gate.acquire();

  expect(gate.inFlight, equals(3));
  expect(gate.waiting, equals(0));
});

Deno.test("Semaphore queues the callers past its limit", async () => {
  const gate = new Semaphore(1);
  const held = await gate.acquire();

  let admitted = false;
  const pending = gate.acquire().then(() => {
    admitted = true;
  });

  await Future.delayed(Duration.milliseconds(1));
  expect(admitted, equals(false));
  expect(gate.waiting, equals(1));

  held();
  await pending;
  expect(admitted, isTrue);
});

Deno.test("Semaphore treats a limit below one as one", async () => {
  const gate = new Semaphore(0);
  await gate.acquire();

  expect(gate.inFlight, equals(1));
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
        await Future.delayed(Duration.milliseconds(1));
        inFlight--;
      })),
  );

  expect(peak <= 2, isTrue, `peak was ${peak}`);
});

Deno.test("Semaphore.run releases its slot even when the call throws", async () => {
  const gate = new Semaphore(1);

  await gate.run(() => Promise.reject(new Error("boom"))).catch(() => {});

  expect(gate.inFlight, equals(0));
  await gate.acquire();
  expect(gate.inFlight, equals(1));
});

Deno.test("giving the same place back twice gives back one place, not two", async () => {
  const gate = new Semaphore(2);
  const first = await gate.acquire();
  await gate.acquire();

  first();
  first();

  expect(gate.inFlight, equals(1), "one place was given back twice and the count dropped by two");
});

Deno.test("the limit holds however many times a place is given back", async () => {
  const gate = new Semaphore(1);
  let running = 0;
  let peak = 0;

  const body = async () => {
    const release = await gate.acquire();
    running++;
    peak = Math.max(peak, running);
    await Promise.resolve();
    running--;
    release();
    release();
  };

  await Promise.all([body(), body(), body()]);

  expect(peak, equals(1), "a semaphore of one let more than one caller through");
});
