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

import { nextRunOf } from "@scribe/host/dependencies/features/messagings/mail/campaigns.ts";
import { CronTimezone } from "@scribe/foundation/src/cron/timezone.ts";
import { assert, assertEquals } from "@std/assert";

const PARIS = CronTimezone.EuropeParis;

function iso(ms: number): string {
  return new Date(ms).toISOString();
}

Deno.test("a `once` schedule fires at its date, then never again", () => {
  const at = Date.UTC(2026, 8, 1, 7, 0);

  assertEquals(nextRunOf({ kind: "once", at }, at - 1), at);
  assertEquals(
    nextRunOf({ kind: "once", at }, at),
    null,
    "once the date is reached the campaign has no next run and deactivates",
  );
});

Deno.test("a daily cron pins the hour instead of drifting", () => {
  const schedule = { kind: "cron", expression: "0 9 * * *", timezone: PARIS } as const;

  const first = nextRunOf(schedule, Date.UTC(2026, 5, 1, 12, 0));
  assert(first !== null);
  assertEquals(iso(first), "2026-06-02T07:00:00.000Z", "09:00 Paris = 07:00 UTC en heure d'ete");

  const second = nextRunOf(schedule, first);
  assert(second !== null);
  assertEquals(
    second - first,
    24 * 60 * 60 * 1000,
    "exactly 24h, where a frequency_hours computed from last_run_at would have drifted",
  );
});

Deno.test("the schedule follows daylight saving time, it does not drift with it", () => {
  const schedule = { kind: "cron", expression: "0 9 * * *", timezone: PARIS } as const;

  const beforeSwitch = nextRunOf(schedule, Date.UTC(2026, 9, 24, 12, 0));
  assert(beforeSwitch !== null);
  assertEquals(
    iso(beforeSwitch),
    "2026-10-25T08:00:00.000Z",
    "once the clocks go back, 09:00 in Paris is 08:00 UTC",
  );
});

Deno.test("a weekly cron lands on the right weekday", () => {
  const next = nextRunOf(
    { kind: "cron", expression: "0 8 * * 1", timezone: PARIS },
    Date.UTC(2026, 5, 3, 12, 0),
  );
  assert(next !== null);
  assertEquals(new Date(next).getUTCDay(), 1, "lundi");
  assertEquals(iso(next), "2026-06-08T06:00:00.000Z");
});

Deno.test("a monthly cron lands on the right day of month", () => {
  const next = nextRunOf(
    { kind: "cron", expression: "0 10 1 * *", timezone: PARIS },
    Date.UTC(2026, 5, 15, 12, 0),
  );
  assert(next !== null);
  assertEquals(iso(next), "2026-07-01T08:00:00.000Z");
});
