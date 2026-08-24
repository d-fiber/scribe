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
  FixedNow,
  having,
  isA,
  isFalse,
  isTrue,
  SequentialUuids,
  throwsA,
} from "../../test/mod.ts";
import { DateTime, Duration, FormatException, Now, Uuid, Uuids } from "../../mod.ts";

Deno.test("now reads the source in force, so a case decides what time it is", () => {
  const fixed = new FixedNow(DateTime.parse("2026-01-01T00:00:00.000Z").millisecondsSinceEpoch);
  Now.use(fixed);

  expect(DateTime.now().toIso8601String(), equals("2026-01-01T00:00:00.000Z"));

  fixed.pass(Duration.hours(2));
  expect(DateTime.now().toIso8601String(), equals("2026-01-01T02:00:00.000Z"));
});

Deno.test("an instant never moves, so what a caller adds reaches nobody else", () => {
  const at = DateTime.fromMillisecondsSinceEpoch(1000);

  const later = at.add(Duration.seconds(5));

  expect(at.millisecondsSinceEpoch, equals(1000));
  expect(later.millisecondsSinceEpoch, equals(6000));
});

Deno.test("the difference between two instants is a duration, and it may be negative", () => {
  const first = DateTime.fromMillisecondsSinceEpoch(1000);
  const second = first.add(Duration.minutes(3));

  expect(second.difference(first).inMinutes, equals(3));
  expect(first.difference(second).inMinutes, equals(-3));
});

Deno.test("one instant knows whether it comes before another, after it, or at the same moment", () => {
  const at = DateTime.fromMillisecondsSinceEpoch(1000);
  const later = at.add(Duration.milliseconds(1));

  expect(at.isBefore(later), equals(true));
  expect(later.isAfter(at), equals(true));
  expect(at.isAtSameMomentAs(DateTime.fromMillisecondsSinceEpoch(1000)), equals(true));
});

Deno.test("parsing something that names no instant refuses instead of answering a broken one", () => {
  expect(
    () => DateTime.parse("the day before yesterday"),
    throwsA(having(isA(FormatException), (raised) => raised.message, "message", contains("Expected a date"))),
  );
});

Deno.test("a duration says how long in every unit it was not written in", () => {
  const held = Duration.minutes(90);

  expect(held.inHours, equals(1.5));
  expect(held.inSeconds, equals(5400));
  expect(held.inMilliseconds, equals(5_400_000));
});

Deno.test("counting identifiers follow one another and still read as their version", () => {
  const drawn = new SequentialUuids();
  Uuids.use(drawn);

  expect(Uuid.v4(), equals("00000000-0000-4000-8000-000000000001"));
  expect(Uuid.v6(), equals("00000000-0000-6000-8000-000000000002"));
  expect(drawn.handed.length, equals(2));
});

Deno.test("the epoch is the instant every count here is measured from", () => {
  expect(DateTime.epoch.millisecondsSinceEpoch, equals(0));
  expect(DateTime.epoch.toIso8601String(), equals("1970-01-01T00:00:00.000Z"));
});

Deno.test("an instant says how far it is from the epoch in both units", () => {
  const at = DateTime.fromMillisecondsSinceEpoch(2500);

  expect(at.millisecondsSinceEpoch, equals(2500));
  expect(at.secondsSinceEpoch, equals(2.5));
});

Deno.test("an instant prints as the one way an instant is written", () => {
  const at = DateTime.fromMillisecondsSinceEpoch(1000);

  expect(at.toString(), equals("1970-01-01T00:00:01.000Z"));
  expect(at.millisecondsSinceEpoch, equals(1000));
  expect(at.isBefore(DateTime.fromMillisecondsSinceEpoch(1001)), equals(true));
});

Deno.test("two instants of the same moment are equal however each was built", () => {
  const written = DateTime.fromMillisecondsSinceEpoch(1000);

  expect(written.equals(DateTime.parse("1970-01-01T00:00:01.000Z")), isTrue, "the same moment was not equal to itself");
  expect(written.equals(DateTime.fromMillisecondsSinceEpoch(1001)), isFalse);
});

Deno.test("what is parsed reads back as what it was written from", () => {
  const written = "2026-08-23T14:05:06.789Z";

  expect(DateTime.parse(written).toIso8601String(), equals(written));
});

Deno.test("a source can be set outright, not only moved forward", () => {
  const now = new FixedNow(0);
  Now.use(now);

  now.set(5000);

  expect(DateTime.now().millisecondsSinceEpoch, equals(5000));
});

Deno.test("the two versions differ where the version is written, and nowhere else", () => {
  Uuids.use(new SequentialUuids());

  const four = Uuid.v4();
  const six = Uuid.v6();

  expect(four[14], equals("4"));
  expect(six[14], equals("6"));
  expect(four.length, equals(six.length));
});
