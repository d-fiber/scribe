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
import { FakeTime } from "@std/testing/time";
import { equals, expect, isFalse, isTrue, Scribe } from "@scribe/alchemy/test";
import type { UnmodifiableList } from "@scribe/alchemy";
import {
  atLeast,
  isLoggedLevel,
  log,
  type LoggedEntry,
  type Logger,
  Loggers,
  LogSink,
  severityOf,
} from "@scribe/alchemy/observe";

class Keeping extends LogSink {
  readonly seen: LoggedEntry[] = [];

  override each(entry: LoggedEntry): void {
    this.seen.push(entry);
  }
}

function entry(over: Partial<LoggedEntry> = {}): LoggedEntry {
  return {
    level: "info",
    node: null,
    action: "audience.member_added",
    actorType: null,
    actorId: null,
    metadata: {},
    timestamp: 0,
    traceId: null,
    invocationId: null,
    ...over,
  };
}

Scribe.test("the four levels run from the least to the most serious, and nothing else is one", () => {
  expect(severityOf("debug"), equals(0));
  expect(severityOf("error"), equals(3));
  expect(isLoggedLevel("warn"), isTrue, "warn was refused as a level");
  expect(isLoggedLevel("fatal"), isFalse, "fatal was taken for a level");
});

Scribe.test("a floor is a comparison, not a list of the names somebody remembered", () => {
  expect(atLeast("error", "warn"), isTrue, "an error did not clear a warn floor");
  expect(atLeast("warn", "warn"), isTrue, "a warn did not clear its own floor");
  expect(atLeast("info", "warn"), isFalse, "an info cleared a warn floor");
});

Scribe.test("what a package records reaches the logger in force at the call", () => {
  const said: string[] = [];
  const keeping: Logger = {
    debug: (action) => said.push(`debug ${action}`),
    info: (action) => said.push(`info ${action}`),
    warn: (action) => said.push(`warn ${action}`),
    error: (action) => said.push(`error ${action}`),
    at: (level, action) => said.push(`${level} ${action}`),
  };
  Loggers.use(keeping);

  log.info("audience.member_added");
  log.at("warn", "audience.quota_near");

  expect(said, equals(["info audience.member_added", "warn audience.quota_near"]));
});

Scribe.test("a sink is handed every entry of a delivery, in the order it was recorded", async () => {
  const sink = new Keeping();

  await sink.receive([entry({ action: "first" }), entry({ action: "second" })]);
  await sink.flush();

  expect(sink.seen.map((one) => one.action), equals(["first", "second"]));
});

Scribe.test("flushing a sink hands over what it held and stops it waiting to", async () => {
  const sink = new Keeping();

  await sink.receive([entry()]);
  await sink.flush();
  await sink.flush();

  expect(sink.seen.length, equals(1), "flushing twice handed the same entry over twice");
});

Scribe.test("what a package records reaches the logger at every one of the four levels", () => {
  const said: string[] = [];
  const keeping: Logger = {
    debug: (action) => said.push(`debug ${action}`),
    info: (action) => said.push(`info ${action}`),
    warn: (action) => said.push(`warn ${action}`),
    error: (action) => said.push(`error ${action}`),
    at: (level, action) => said.push(`${level} ${action}`),
  };
  Loggers.use(keeping);

  log.debug("audience.trace");
  log.warn("audience.quota_near");
  log.error("audience.write_failed");

  expect(said, equals(["debug audience.trace", "warn audience.quota_near", "error audience.write_failed"]));
});

class Blocking extends LogSink {
  readonly blocks: string[][] = [];
  readonly #size: number;

  constructor(size: number) {
    super();
    this.#size = size;
  }

  protected override blockSize(): number {
    return this.#size;
  }

  protected override block(entries: UnmodifiableList<LoggedEntry>): void {
    this.blocks.push(entries.map((one) => one.action));
  }
}

Scribe.test("block gathers entries by blockSize, and hands over a full block as soon as it fills", async () => {
  const sink = new Blocking(2);

  await sink.receive([entry({ action: "a" }), entry({ action: "b" }), entry({ action: "c" })]);

  expect(sink.blocks, equals([["a", "b"]]), "a full block was not handed over on its own");

  await sink.flush();
  expect(sink.blocks, equals([["a", "b"], ["c"]]), "flush did not hand over the entries still held");
});

Scribe.test("a blockSize of zero or less turns gathering off, and block sees each delivery as it arrives", async () => {
  const sink = new Blocking(0);

  await sink.receive([entry({ action: "a" })]);
  await sink.receive([entry({ action: "b" }), entry({ action: "c" })]);

  expect(sink.blocks, equals([["a"], ["b", "c"]]), "block did not see each delivery on its own");
});

Scribe.test("an unfinished block is handed over on its own once the linger window passes", async () => {
  const time = new FakeTime();
  try {
    const sink = new Blocking(2);
    await sink.receive([entry({ action: "a" })]);
    expect(sink.blocks.length, equals(0), "an unfinished block was handed over before its linger passed");

    await time.tickAsync(5_000);
    await time.runMicrotasks();

    expect(sink.blocks, equals([["a"]]), "the linger timer did not hand over what an unfinished block held");
  } finally {
    time.restore();
  }
});

Scribe.test("flushing by hand before the linger window passes cancels the timer, so nothing fires twice", async () => {
  const time = new FakeTime();
  try {
    const sink = new Blocking(2);
    await sink.receive([entry({ action: "a" })]);
    await sink.flush();

    await time.tickAsync(5_000);
    await time.runMicrotasks();

    expect(sink.blocks, equals([["a"]]), "the linger timer handed the same block over a second time");
  } finally {
    time.restore();
  }
});

Scribe.test("an exception a linger-triggered flush raises is caught and reported, not left unhandled", async () => {
  const time = new FakeTime();
  const reported: unknown[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => void reported.push(args);

  try {
    class Throwing extends LogSink {
      protected override blockSize(): number {
        return 2;
      }
      protected override block(): void {
        throw new Error("the collector refused this block");
      }
    }
    new Throwing();
    const sink = new Throwing();
    await sink.receive([entry()]);

    await time.tickAsync(5_000);
    await time.runMicrotasks();

    expect(reported.length, equals(1), "the exception raised by a linger-triggered flush was not reported");
  } finally {
    console.error = original;
    time.restore();
  }
});
