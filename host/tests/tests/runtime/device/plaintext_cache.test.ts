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

import { PlaintextCache } from "@scribe/core/runtime/device/payload/plaintext_cache.ts";
import { assertEquals } from "@std/assert";

const TTL_MS = 60_000;

Deno.test("a miss is undefined, and it is not the same thing as a cached refusal", () => {
  const cache = new PlaintextCache(TTL_MS);

  assertEquals(cache.lookup("absent", 0), undefined);

  cache.remember("bad", null, 0);
  assertEquals(
    cache.lookup("bad", 0),
    null,
    "an undecryptable payload is worth remembering: it is the flood case",
  );
});

Deno.test("a plaintext comes back untouched until its window closes", () => {
  const cache = new PlaintextCache(TTL_MS);
  cache.remember("sealed", '{"iat":1}', 1_000);

  assertEquals(cache.lookup("sealed", 1_000), '{"iat":1}');
  assertEquals(cache.lookup("sealed", 1_000 + TTL_MS - 1), '{"iat":1}');
});

Deno.test("an entry past the freshness window is dropped, never served", () => {
  const cache = new PlaintextCache(TTL_MS);
  cache.remember("sealed", '{"iat":1}', 1_000);

  assertEquals(
    cache.lookup("sealed", 1_000 + TTL_MS),
    undefined,
    "a payload that can no longer be fresh has nothing left to offer",
  );
  assertEquals(cache.size, 0, "the expired entry must not keep occupying a slot");
});

Deno.test("the cache is bounded, so a flood of distinct payloads cannot grow it", () => {
  const cache = new PlaintextCache(TTL_MS, 4);

  for (let i = 0; i < 4; i++) cache.remember(`p${i}`, `{"n":${i}}`, 0);
  assertEquals(cache.size, 4);

  cache.remember("p4", '{"n":4}', 0);
  assertEquals(cache.size, 1, "overflow clears rather than growing without bound");
  assertEquals(cache.lookup("p4", 0), '{"n":4}');
  assertEquals(cache.lookup("p0", 0), undefined);
});
