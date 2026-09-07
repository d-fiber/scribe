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
import { contains, equals, expect, having, isA, MemoryCrons, Scribe, throwsA } from "@scribe/alchemy/test";
import { Duration } from "@scribe/alchemy";

Scribe.test("schedule records the run and answers its key and schedule", () => {
  const crons = new MemoryCrons();
  const schedule = { every: Duration.hours(1) };

  const declared = crons.schedule({ key: "audience:sweep", schedule, run: () => {} });

  expect(declared, equals({ key: "audience:sweep", schedule }));
  expect(crons.taken.get("audience:sweep")?.schedule, equals(schedule));
});

Scribe.test("firing a declared run calls what it was scheduled with", async () => {
  const crons = new MemoryCrons();
  let ran = 0;
  crons.schedule({
    key: "audience:sweep",
    schedule: { every: Duration.hours(1) },
    run: () => {
      ran++;
    },
  });

  await crons.fire("audience:sweep");
  await crons.fire("audience:sweep");

  expect(ran, equals(2));
});

Scribe.test("firing a key nobody scheduled refuses, naming the key and what is known", async () => {
  const crons = new MemoryCrons();
  crons.schedule({ key: "audience:sweep", schedule: { every: Duration.hours(1) }, run: () => {} });

  expect(
    () => crons.fire("audience:missing"),
    throwsA(
      having(
        isA(Error),
        (raised) => raised.message,
        "message",
        contains('No scheduled run was declared under "audience:missing"'),
      ),
    ),
  );
  expect(
    () => crons.fire("audience:missing"),
    throwsA(having(isA(Error), (raised) => raised.message, "message", contains("audience:sweep"))),
  );
});
