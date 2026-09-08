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

import "@scribe/scholium/runner.ts";
import { equals, expect, FixedNow, MemoryValkery, MemoryValkeries, same, Scribe } from "@scribe/alchemy/test";
import { Duration, Now } from "@scribe/alchemy";

Scribe.test("getMany answers each id in the order it was asked, null where nothing is held", async () => {
  const valkery = new MemoryValkery<string>({ key: "members" });
  await valkery.add("a", "value-a");
  await valkery.add("c", "value-c");

  const found = await valkery.getMany(["a", "b", "c"]);

  expect(found, equals(["value-a", null, "value-c"]));
});

Scribe.test("addMany holds every entry it was given", async () => {
  const valkery = new MemoryValkery<number>({ key: "members" });

  await valkery.addMany([["a", 1], ["b", 2]]);

  expect(await valkery.get("a"), equals(1));
  expect(await valkery.get("b"), equals(2));
});

Scribe.test("deleteMany forgets every identifier it was given, and leaves the rest", async () => {
  const valkery = new MemoryValkery<string>({ key: "members" });
  await valkery.addMany([["a", "1"], ["b", "2"], ["c", "3"]]);

  await valkery.deleteMany("a", "c");

  expect(await valkery.get("a"), equals(null));
  expect(await valkery.get("b"), equals("2"));
  expect(await valkery.get("c"), equals(null));
});

Scribe.test("clear with a pattern forgets only the identifiers that match it", async () => {
  const valkery = new MemoryValkery<string>({ key: "members" });
  await valkery.addMany([["session:1", "a"], ["session:2", "b"], ["profile:1", "c"]]);

  await valkery.clear("session:*");

  expect(await valkery.get("session:1"), equals(null));
  expect(await valkery.get("session:2"), equals(null));
  expect(await valkery.get("profile:1"), equals("c"));
});

Scribe.test("clear without a pattern empties the whole Valkery", async () => {
  const valkery = new MemoryValkery<string>({ key: "members" });
  await valkery.addMany([["a", "1"], ["b", "2"]]);

  await valkery.clear();

  expect(valkery.size, equals(0));
});

Scribe.test("size counts an expired entry until something reads and forgets it", async () => {
  const now = new FixedNow(0);
  Now.use(now);
  const valkery = new MemoryValkery<string>({ key: "members", ttl: Duration.seconds(1) });
  await valkery.add("a", "value-a");

  now.pass(Duration.seconds(2));
  expect(valkery.size, equals(1), "an expired entry nobody read yet was not counted");

  await valkery.get("a");
  expect(valkery.size, equals(0), "reading an expired entry did not forget it");
});

Scribe.test("upsert runs the computation once even when two callers ask at the same time", async () => {
  const valkery = new MemoryValkery<string>({ key: "members" });
  let computations = 0;
  const compute = () => {
    computations++;
    return Promise.resolve("computed");
  };

  const [first, second] = await Promise.all([valkery.upsert("a", compute), valkery.upsert("a", compute)]);

  expect(first, equals("computed"));
  expect(second, equals("computed"));
  expect(computations, equals(1));
  expect(valkery.computed, equals(1));
});

Scribe.test("opening the same key twice answers the same Valkery", () => {
  const driver = new MemoryValkeries();

  const first = driver.open<string>({ key: "members" });
  const second = driver.open<string>({ key: "members" });

  expect(first, same(second));
});
