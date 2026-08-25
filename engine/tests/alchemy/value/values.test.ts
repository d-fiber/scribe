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

import {
  contains,
  equals,
  expect,
  expectLater,
  having,
  isA,
  isFalse,
  isTrue,
  throwsA,
} from "@scribe/alchemy/test/mod.ts";
import { Bytes, Completer, Duration, Failure, Ok, okay, Pagination, Refusal, Slot } from "@scribe/alchemy/mod.ts";

Deno.test("a slot hands back what was put in it", () => {
  const slot = new Slot<string>("realtime");
  slot.use("open");

  expect(slot.get(), equals("open"), "the slot answered something other than what it was given");
});

Deno.test("a slot nobody configured refuses instead of answering nothing", () => {
  expect(
    () => new Slot<string>("realtime").get(),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("was never given a value"))),
  );
});

Deno.test("a slot says whether it was configured without being asked for the value", () => {
  const slot = new Slot<number>("cache");

  expect(slot.configured, isFalse, "an untouched slot claims to be configured");
  slot.use(1);
  expect(slot.configured, isTrue, "a slot that was given a value denies being configured");
});

Deno.test("a duration is the same however it was written", () => {
  expect(
    Duration.seconds(90).inMilliseconds,
    equals(Duration.minutes(1).inMilliseconds + Duration.seconds(30).inMilliseconds),
    "90 seconds is not a minute and a half",
  );
  expect(Duration.days(1).inMilliseconds, equals(Duration.hours(24).inMilliseconds), "a day is not twenty four hours");
});

Deno.test("a size is the same however it was written", () => {
  expect(Bytes.kilobytes(1).inBytes, equals(Bytes.of(1024).inBytes), "a kilobyte is not 1024 bytes");
  expect(Bytes.gigabytes(1).inMegabytes, equals(1024), "a gigabyte is not 1024 megabytes");
});

Deno.test("an outcome carries its data or its error, and says which", () => {
  const kept: Ok<number> = new Ok(3);
  const refused: Failure<string> = new Failure("no such row");

  expect(kept.ok, isTrue, "an Ok denies being one");
  expect(kept.data, equals(3), "the Ok lost what it carried");
  expect(refused.ok, isFalse, "a Failure claims to be an Ok");
  expect(refused.error, equals("no such row"), "the Failure lost its reason");
});

Deno.test("a page hands back the rows it was asked for, and no more", () => {
  const page = Pagination.of([1, 2, 3, 4], 0, 3);

  expect(page.items, equals([1, 2, 3]), "the page kept the row that proves there is another one");
  expect(page.hasMore, isTrue, "a page with a row to spare says there is nothing after it");
});

Deno.test("a page that fits says there is nothing after it", () => {
  const page = Pagination.of([1, 2], 10, 3);

  expect(page.items, equals([1, 2]), "the page dropped a row it was given");
  expect(page.hasMore, isFalse, "a page shorter than its size claims there is more");
  expect(page.offset, equals(10), "the page forgot where it started");
});

Deno.test("an empty page carries nothing and points nowhere", () => {
  const page = Pagination.empty<number>();

  expect(page.items, equals([]), "an empty page holds a row");
  expect(page.hasMore, isFalse, "an empty page claims there is more");
});

Deno.test("a page written out carries the shape a caller reads, not the one it holds", () => {
  const written = Pagination.of([1, 2, 3, 4], 10, 3).toJson();

  expect(written.items, equals([1, 2, 3]));
  expect(written.pagination.offset, equals(10));
  expect(written.pagination.has_more, isTrue, "the written page lost that there is more after it");
});

Deno.test("writing a page out copies its rows, so nobody writes back into the page", () => {
  const page = Pagination.of([1, 2], 0, 3);
  const written = page.toJson();

  written.items.push(99);

  expect(page.items.length, equals(2), "the page was changed through what was written out");
});

Deno.test("the three ordered values sort by what they hold, not by how they were written", () => {
  const held = [Duration.hours(1), Duration.milliseconds(5), Duration.minutes(2)];
  held.sort((a, b) => a.compareTo(b));

  expect(held.map((one) => one.inMilliseconds), equals([5, 120_000, 3_600_000]));

  const sizes = [Bytes.gigabytes(1), Bytes.of(7), Bytes.megabytes(3)];
  sizes.sort((a, b) => a.compareTo(b));

  expect(sizes.map((one) => one.inBytes), equals([7, 3 * 1024 * 1024, 1024 * 1024 * 1024]));
});

Deno.test("a completer answers what settles it, and a second settling changes nothing", async () => {
  const completer = new Completer<string>();

  completer.complete("first");
  completer.complete("second");

  expect(await completer.future, equals("first"));
  expect(completer.isCompleted, isTrue, "a settled completer says it is still waiting");
});

Deno.test("two durations add and subtract, and a subtraction may go below nothing", () => {
  const window = Duration.minutes(1);

  expect(window.add(Duration.seconds(30)).inSeconds, equals(90));
  expect(window.subtract(Duration.seconds(30)).inSeconds, equals(30));
  expect(Duration.seconds(1).subtract(Duration.seconds(3)).inSeconds, equals(-2));
});

Deno.test("a duration never moves, so what a caller adds reaches nobody else", () => {
  const window = Duration.minutes(1);

  window.add(Duration.hours(1));

  expect(window.inMinutes, equals(1), "the duration was changed by adding to it");
});

Deno.test("two quantities of bytes add and subtract", () => {
  const limit = Bytes.megabytes(1);

  expect(limit.add(Bytes.kilobytes(512)).inKilobytes, equals(1536));
  expect(limit.subtract(Bytes.kilobytes(512)).inKilobytes, equals(512));
});

Deno.test("a quantity prints with the unit it is read in", () => {
  expect(Bytes.kilobytes(2).toString(), equals("2 KB"));
  expect(Bytes.of(512).toString(), equals("512 B"));
  expect(Bytes.megabytes(1).toString(), equals("1 MB"));
  expect(Bytes.of(1536).toString(), equals("1.5 KB"));
});

Deno.test("a quantity compares against another through the member written for it", () => {
  expect(
    Bytes.megabytes(1).compareTo(Bytes.kilobytes(999)) > 0,
    isTrue,
    "a megabyte did not compare above 999 kilobytes",
  );
});

Deno.test("two quantities of the same size are equal however each was written", () => {
  expect(Bytes.kilobytes(1).equals(Bytes.of(1024)), isTrue, "a kilobyte was not a thousand and twenty four bytes");
  expect(Bytes.kilobytes(1).equals(Bytes.of(1023)), isFalse);
});

Deno.test("a duration prints with the unit it is read in", () => {
  expect(Duration.milliseconds(250).toString(), equals("250ms"));
  expect(Duration.seconds(90).toString(), equals("1.5min"));
  expect(Duration.days(7).toString(), equals("7d"));
  expect(Duration.milliseconds(0).toString(), equals("0s"));
});

Deno.test("two durations of the same length are equal however each was written", () => {
  expect(Duration.seconds(60).equals(Duration.minutes(1)), isTrue, "sixty seconds was not one minute");
  expect(Duration.seconds(59).equals(Duration.minutes(1)), isFalse);
});

Deno.test("an outcome that carries nothing still says which one it is", () => {
  const kept = okay;
  const refused = new Failure(Refusal.invalid("nothing to carry."));

  expect(kept.ok, isTrue, "an outcome built as a success says it failed");
  expect(refused.ok, isFalse, "an outcome built as a failure says it worked");
});

Deno.test("the total of a page counts what is known, and one more when there is another page", () => {
  expect(Pagination.of([1, 2, 3, 4], 10, 3).total, equals(14));
  expect(Pagination.of([1, 2], 10, 3).total, equals(12));
  expect(Pagination.empty<number>().total, equals(0));
});

Deno.test("a completer that fails rejects what waits on it, once and no more", async () => {
  const completer = new Completer<string>();

  expect(completer.isCompleted, isFalse, "a completer says it is settled before anything settled it");
  completer.completeError(new Error("the socket closed"));
  completer.complete("too late");

  await expectLater(
    () => completer.future,
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("the socket closed"))),
  );
});

Deno.test("comparing two values reads the unit each of them holds", () => {
  expect(Number(Duration.minutes(1)), equals(60_000), "a duration compared as something other than milliseconds");
  expect(Number(Bytes.kilobytes(2)), equals(2048), "a quantity compared as something other than bytes");
  expect(
    (Duration.seconds(30) as never) < (Duration.minutes(1) as never),
    isTrue,
    "thirty seconds was not under a minute",
  );
});
