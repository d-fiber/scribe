// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import { nextRunOf } from "@scribe/host/dependencies/features/messagings/mail/campaigns.ts";
import { CronTimezone } from "@scribe/host/packages/foundation/event_driven/cron/timezone.ts";
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
