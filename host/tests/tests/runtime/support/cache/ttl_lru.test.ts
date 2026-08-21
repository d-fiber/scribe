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

import { TtlLru } from "@scribe/core/runtime/support/cache/ttl_lru.ts";
import { assertEquals } from "@std/assert";

class Clock {
  #at = 1_000;

  readonly now = (): number => this.#at;

  advance(ms: number): void {
    this.#at += ms;
  }
}

function cache(max = 3, ttlMs = 5_000): { lru: TtlLru<string>; clock: Clock } {
  const clock = new Clock();
  return { lru: new TtlLru<string>({ max, ttlMs, now: clock.now }), clock };
}

Deno.test("a value written is a value read back", () => {
  const { lru } = cache();

  lru.set("a", "one");

  assertEquals(lru.get("a"), "one");
  assertEquals(lru.get("missing"), null);
});

Deno.test("an entry stops answering once its window has passed", () => {
  const { lru, clock } = cache();

  lru.set("a", "one");
  clock.advance(4_999);
  assertEquals(lru.get("a"), "one", "the window is not over yet");

  clock.advance(1);
  assertEquals(lru.get("a"), null, "the ttl is the window a caller accepts being wrong for");
  assertEquals(lru.size, 0, "the expired entry must be dropped on the read, not left to pile up");
});

Deno.test("a write refreshes the window rather than keeping the first one", () => {
  const { lru, clock } = cache();

  lru.set("a", "one");
  clock.advance(4_000);
  lru.set("a", "two");
  clock.advance(4_000);

  assertEquals(lru.get("a"), "two");
});

Deno.test("a full cache drops the least recently read entry, not the oldest written", () => {
  const { lru } = cache(3);

  lru.set("a", "one");
  lru.set("b", "two");
  lru.set("c", "three");
  lru.get("a");

  lru.set("d", "four");

  assertEquals(lru.get("b"), null, "b was the least recently read of the three");
  assertEquals(lru.get("a"), "one", "reading a is what saved it");
  assertEquals(lru.get("c"), "three");
  assertEquals(lru.get("d"), "four");
  assertEquals(lru.size, 3, "the bound is what keeps this off the process's memory");
});

Deno.test("clear forgets everything, which is what a revocation asks for", () => {
  const { lru } = cache();

  lru.set("a", "one");
  lru.set("b", "two");
  lru.clear();

  assertEquals(lru.get("a"), null);
  assertEquals(lru.get("b"), null);
  assertEquals(lru.size, 0);
});

Deno.test("a max under one still holds an entry instead of holding none", () => {
  const { lru } = cache(0);

  lru.set("a", "one");

  assertEquals(lru.get("a"), "one", "a zero bound would make every write a no-op, silently");
});
