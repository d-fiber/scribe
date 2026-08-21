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

import { assert, assertEquals, assertFalse, assertThrows } from "@std/assert";
import { emptyPagination, Failure, OK, pagination, Size, Slot, Time } from "../mod.ts";

Deno.test("a slot hands back what was put in it", () => {
  const slot = new Slot<string>("realtime");
  slot.use("open");

  assertEquals(slot.get(), "open", "the slot answered something other than what it was given");
});

Deno.test("a slot nobody configured refuses instead of answering nothing", () => {
  assertThrows(
    () => new Slot<string>("realtime").get(),
    Error,
    "was never given a value",
  );
});

Deno.test("a slot says whether it was configured without being asked for the value", () => {
  const slot = new Slot<number>("cache");

  assertFalse(slot.configured, "an untouched slot claims to be configured");
  slot.use(1);
  assert(slot.configured, "a slot that was given a value denies being configured");
});

Deno.test("a duration is the same however it was written", () => {
  assertEquals(Time.seconds(90).ms, Time.minutes(1).ms + Time.seconds(30).ms, "90 seconds is not a minute and a half");
  assertEquals(Time.days(1).ms, Time.hours(24).ms, "a day is not twenty four hours");
});

Deno.test("a size is the same however it was written", () => {
  assertEquals(Size.kilobytes(1).value, Size.bytes(1024).value, "a kilobyte is not 1024 bytes");
  assertEquals(Size.gigabytes(1).mb, 1024, "a gigabyte is not 1024 megabytes");
});

Deno.test("an outcome carries its data or its error, and says which", () => {
  const kept: OK<number> = new OK(3);
  const refused: Failure<string> = new Failure("no such row");

  assert(kept.ok, "an OK denies being one");
  assertEquals(kept.data, 3, "the OK lost what it carried");
  assertFalse(refused.ok, "a Failure claims to be an OK");
  assertEquals(refused.error, "no such row", "the Failure lost its reason");
});

Deno.test("a page hands back the rows it was asked for, and no more", () => {
  const page = pagination([1, 2, 3, 4], 0, 3);

  assertEquals(page.items, [1, 2, 3], "the page kept the row that proves there is another one");
  assert(page.pagination.has_more, "a page with a row to spare says there is nothing after it");
});

Deno.test("a page that fits says there is nothing after it", () => {
  const page = pagination([1, 2], 10, 3);

  assertEquals(page.items, [1, 2], "the page dropped a row it was given");
  assertFalse(page.pagination.has_more, "a page shorter than its size claims there is more");
  assertEquals(page.pagination.offset, 10, "the page forgot where it started");
});

Deno.test("an empty page carries nothing and points nowhere", () => {
  const page = emptyPagination<number>();

  assertEquals(page.items, [], "an empty page holds a row");
  assertFalse(page.pagination.has_more, "an empty page claims there is more");
});
