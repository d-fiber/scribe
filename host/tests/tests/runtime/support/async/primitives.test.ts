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

import { ExponentialBackoff } from "@scribe/core/runtime/support/async/backoff.ts";
import { runPooled } from "@scribe/core/runtime/support/async/pool.ts";
import { sleep } from "@scribe/core/runtime/support/async/sleep.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("ExponentialBackoff doubles from the base and stops at the ceiling", () => {
  const backoff = new ExponentialBackoff(1_000, 30_000);

  assertEquals(backoff.delayFor(1), 1_000);
  assertEquals(backoff.delayFor(2), 2_000);
  assertEquals(backoff.delayFor(3), 4_000);
  assertEquals(backoff.delayFor(6), 30_000);
  assertEquals(backoff.delayFor(50), 30_000);
});

Deno.test("ExponentialBackoff never returns more than the ceiling, even at attempt 1", () => {
  const backoff = new ExponentialBackoff(5_000, 1_000);

  assertEquals(backoff.delayFor(1), 1_000);
});

Deno.test("ExponentialBackoff treats attempt 0 and negatives as the first attempt", () => {
  const backoff = new ExponentialBackoff(500, 10_000);

  assertEquals(backoff.delayFor(0), 500);
  assertEquals(backoff.delayFor(-3), 500);
});

Deno.test("ExponentialBackoff honours a custom factor", () => {
  const backoff = new ExponentialBackoff(100, 100_000, 3);

  assertEquals(backoff.delayFor(2), 300);
  assertEquals(backoff.delayFor(3), 900);
});

Deno.test("runPooled visits every item exactly once", async () => {
  const seen: number[] = [];
  const items = Array.from({ length: 25 }, (_, i) => i);

  await runPooled(items, 4, (item) => {
    seen.push(item);
    return Promise.resolve();
  });

  assertEquals(seen.length, 25);
  assertEquals([...seen].sort((a, b) => a - b), items);
});

Deno.test("runPooled never exceeds the requested concurrency", async () => {
  let inFlight = 0;
  let peak = 0;

  await runPooled(Array.from({ length: 30 }, (_, i) => i), 3, async () => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await sleep(1);
    inFlight--;
  });

  assert(peak <= 3, `peak concurrency was ${peak}`);
});

Deno.test("runPooled still runs everything when the limit is zero or negative", async () => {
  const seen: number[] = [];

  await runPooled([1, 2, 3], 0, (item) => {
    seen.push(item);
    return Promise.resolve();
  });
  await runPooled([4, 5], -1, (item) => {
    seen.push(item);
    return Promise.resolve();
  });

  assertEquals(seen, [1, 2, 3, 4, 5]);
});

Deno.test("runPooled on an empty list resolves without calling the worker", async () => {
  let calls = 0;

  await runPooled([], 4, () => {
    calls++;
    return Promise.resolve();
  });

  assertEquals(calls, 0);
});
