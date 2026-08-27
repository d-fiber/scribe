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

import { PlaintextCache } from "@scribe/runtime/device/payload/plaintext_cache.ts";
import { assertEquals } from "@std/assert";

const TTL_MS = 60_000;

/** A cache whose clock the test moves, so a window can close without anything waiting. */
function cacheAt(clock: { now: number }, limit?: number): PlaintextCache {
  return new PlaintextCache(TTL_MS, limit, () => clock.now);
}

Deno.test("a miss is undefined, and it is not the same thing as a cached refusal", () => {
  const cache = cacheAt({ now: 0 });

  assertEquals(cache.lookup("absent"), undefined);

  cache.remember("bad", null);
  assertEquals(
    cache.lookup("bad"),
    null,
    "an undecryptable payload is worth remembering: it is the flood case",
  );
});

Deno.test("a plaintext comes back untouched until its window closes", () => {
  const clock = { now: 1_000 };
  const cache = cacheAt(clock);
  cache.remember("sealed", '{"iat":1}');

  assertEquals(cache.lookup("sealed"), '{"iat":1}');
  clock.now = 1_000 + TTL_MS - 1;
  assertEquals(cache.lookup("sealed"), '{"iat":1}');
});

Deno.test("an entry past the freshness window is dropped, never served", () => {
  const clock = { now: 1_000 };
  const cache = cacheAt(clock);
  cache.remember("sealed", '{"iat":1}');

  clock.now = 1_000 + TTL_MS;
  assertEquals(
    cache.lookup("sealed"),
    undefined,
    "a payload that can no longer be fresh has nothing left to offer",
  );
  assertEquals(cache.size, 0, "the expired entry must not keep occupying a slot");
});

Deno.test("the cache is bounded, so a flood of distinct payloads cannot grow it", () => {
  const cache = cacheAt({ now: 0 }, 4);

  for (let payload = 0; payload < 8; payload++) cache.remember(`p${payload}`, `{"n":${payload}}`);

  assertEquals(cache.size, 4);
  assertEquals(cache.lookup("p7"), '{"n":7}');
  assertEquals(cache.lookup("p0"), undefined);
});

Deno.test("a flood drops the oldest payloads, not every payload it can reach", () => {
  const cache = cacheAt({ now: 0 }, 16);

  for (let real = 0; real < 10; real++) cache.remember(`legit-${real}`, `{"n":${real}}`);
  for (let junk = 0; junk < 8; junk++) cache.remember(`junk-${junk}`, null);

  assertEquals(cache.size, 16);
  assertEquals(
    cache.lookup("legit-9"),
    '{"n":9}',
    "emptying the table at the limit put every caller back to a seventy microsecond exchange, at the price of one flood",
  );
  assertEquals(cache.lookup("legit-0"), undefined, "the oldest is what a bounded table gives up");
});

Deno.test("a payload that keeps being presented is not what a flood pushes out", () => {
  const cache = cacheAt({ now: 0 }, 4);
  cache.remember("busy", '{"n":1}');

  for (let junk = 0; junk < 8; junk++) {
    assertEquals(cache.lookup("busy"), '{"n":1}');
    cache.remember(`junk-${junk}`, null);
  }

  assertEquals(
    cache.lookup("busy"),
    '{"n":1}',
    "reading an entry is what makes it recent, which is what keeps a live client out of the way of a flood",
  );
});
