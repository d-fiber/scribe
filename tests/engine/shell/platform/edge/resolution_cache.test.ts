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

import { ResolutionCache } from "@scribe/shell/platform/edge/services/resolution_cache.ts";
import { assertEquals } from "@std/assert";

Deno.test("a miss is undefined, and it is not the same thing as a name that was not found", () => {
  const cache = new ResolutionCache();

  assertEquals(cache.lookup("never-asked"), undefined);

  cache.remember("absent", null);
  assertEquals(cache.lookup("absent"), null, "a name that is not on disk is worth remembering too");
});

Deno.test("the cache is bounded, so a caller naming services cannot grow it", () => {
  const cache = new ResolutionCache(4);

  for (let name = 0; name < 8; name++) cache.remember(`s${name}`, `/srv/s${name}`);

  assertEquals(cache.size, 4);
  assertEquals(cache.lookup("s7"), "/srv/s7");
  assertEquals(cache.lookup("s0"), undefined);
});

Deno.test("a flood of names that do not exist drops the oldest, not everything held", () => {
  const cache = new ResolutionCache(16);

  for (let real = 0; real < 10; real++) cache.remember(`node-${real}`, `/srv/node-${real}`);
  for (let junk = 0; junk < 8; junk++) cache.remember(`junk-${junk}`, null);

  assertEquals(cache.size, 16);
  assertEquals(
    cache.lookup("node-9"),
    "/srv/node-9",
    "emptying the table at the limit made every service on the box walk the directory again, at the price of one flood",
  );
  assertEquals(cache.lookup("node-0"), undefined);
});

Deno.test("remembering a name twice holds it once", () => {
  const cache = new ResolutionCache(4);

  cache.remember("s", "/srv/s");
  cache.remember("s", "/srv/s-moved");

  assertEquals(cache.size, 1);
  assertEquals(cache.lookup("s"), "/srv/s-moved");
});
