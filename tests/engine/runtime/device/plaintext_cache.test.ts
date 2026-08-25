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
