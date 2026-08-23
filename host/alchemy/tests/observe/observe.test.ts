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

import { equals, expect, isFalse, isTrue } from "../../src/test/mod.ts";
import {
  atLeast,
  isLoggedLevel,
  log,
  type LoggedEntry,
  type Logger,
  Loggers,
  LogSink,
  severityOf,
} from "../../src/observe/mod.ts";

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

Deno.test("the four levels run from the least to the most serious, and nothing else is one", () => {
  expect(severityOf("debug"), equals(0));
  expect(severityOf("error"), equals(3));
  expect(isLoggedLevel("warn"), isTrue, "warn was refused as a level");
  expect(isLoggedLevel("fatal"), isFalse, "fatal was taken for a level");
});

Deno.test("a floor is a comparison, not a list of the names somebody remembered", () => {
  expect(atLeast("error", "warn"), isTrue, "an error did not clear a warn floor");
  expect(atLeast("warn", "warn"), isTrue, "a warn did not clear its own floor");
  expect(atLeast("info", "warn"), isFalse, "an info cleared a warn floor");
});

Deno.test("what a package records reaches the logger in force at the call", () => {
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

Deno.test("a sink is handed every entry of a delivery, in the order it was recorded", async () => {
  const sink = new Keeping();

  await sink.receive([entry({ action: "first" }), entry({ action: "second" })]);
  await sink.flush();

  expect(sink.seen.map((one) => one.action), equals(["first", "second"]));
});

Deno.test("flushing a sink hands over what it held and stops it waiting to", async () => {
  const sink = new Keeping();

  await sink.receive([entry()]);
  await sink.flush();
  await sink.flush();

  expect(sink.seen.length, equals(1), "flushing twice handed the same entry over twice");
});
