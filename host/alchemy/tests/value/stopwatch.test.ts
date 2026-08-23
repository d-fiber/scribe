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

import { contains, equals, expect, FixedNow, having, isA, isFalse, throwsA } from "../../src/test/mod.ts";
import { DateTime, Duration, FormatException, Now, Stopwatch } from "../../mod.ts";

Deno.test("a stopwatch counts what the case says passed, and nothing else", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.seconds(90));

  expect(watch.elapsed.inMinutes, equals(1.5));
});

Deno.test("a stopped stopwatch keeps what it counted and stops counting", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.seconds(2));
  watch.stop();
  now.pass(Duration.hours(3));

  expect(watch.elapsedMilliseconds, equals(2000));
  expect(watch.isRunning, isFalse, "a stopped stopwatch says it is still running");
});

Deno.test("counting again adds to what was counted before", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.seconds(1));
  watch.stop();
  watch.start();
  now.pass(Duration.seconds(2));

  expect(watch.elapsedMilliseconds, equals(3000));
});

Deno.test("starting one that runs and stopping one that does not both do nothing", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.seconds(1));
  watch.start();
  now.pass(Duration.seconds(1));

  expect(watch.elapsedMilliseconds, equals(2000));
  watch.stop();
  watch.stop();
  expect(watch.elapsedMilliseconds, equals(2000));
});

Deno.test("a reading that names no instant refuses as a format that was not met", () => {
  expect(
    () => DateTime.parse("the day before yesterday"),
    throwsA(having(isA(FormatException), (raised) => raised.message, "message", contains("Expected"))),
  );
});

Deno.test("a stopwatch nobody started has counted nothing and says so", () => {
  Now.use(new FixedNow(5000));
  const watch = new Stopwatch();

  expect(watch.isRunning, isFalse, "a stopwatch says it runs before anything started it");
  expect(watch.elapsedMilliseconds, equals(0));
});

Deno.test("resetting a running stopwatch drops what it counted and keeps it running", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.seconds(5));
  watch.reset();

  expect(watch.elapsedMilliseconds, equals(0));
  expect(watch.isRunning, equals(true));

  now.pass(Duration.seconds(2));
  expect(watch.elapsedMilliseconds, equals(2000));
});

Deno.test("resetting a stopped stopwatch drops what it counted and leaves it stopped", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.seconds(5));
  watch.stop();
  watch.reset();
  now.pass(Duration.hours(1));

  expect(watch.elapsedMilliseconds, equals(0));
  expect(watch.isRunning, isFalse, "a reset stopwatch started counting again on its own");
});

Deno.test("what a stopwatch answers as a duration is what it answers in milliseconds", () => {
  const now = new FixedNow(0);
  Now.use(now);
  const watch = Stopwatch.started();

  now.pass(Duration.milliseconds(1234));

  expect(watch.elapsed.inMilliseconds, equals(watch.elapsedMilliseconds));
  expect(watch.elapsed.inSeconds, equals(1.234));
});
