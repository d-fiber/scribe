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
