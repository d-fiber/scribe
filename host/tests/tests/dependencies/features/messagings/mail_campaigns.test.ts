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

import { EmailCampaignError, EmailCampaignRepository } from "@scribe/host/dependencies/features/messagings/mail/campaigns.ts";
import { CampaignAudience } from "@scribe/core/contracts/enums.ts";
import { CronTimezone } from "@scribe/foundation/src/cron/timezone.ts";
import type { Row } from "@scribe/foundation/testing/database.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { assert, assertEquals } from "@std/assert";

const TABLE = "internal_t__email_campaigns";
const DAILY = { kind: "cron", expression: "0 9 * * *", timezone: CronTimezone.EuropeParis } as const;

function campaign(overrides: Partial<Row> = {}): Row {
  return {
    email_campaign_id: 1,
    email_template_id: 10,
    audience: CampaignAudience.USER,
    schedule_kind: "cron",
    scheduled_at: null,
    cron_expression: "0 9 * * *",
    schedule_timezone: CronTimezone.EuropeParis,
    next_run_at: 1_000,
    last_run_at: null,
    filters: null,
    data: null,
    is_active: true,
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function harness(rows: Row[] = []) {
  const database = installDatabaseMock({ [TABLE]: rows });
  return {
    campaigns: new EmailCampaignRepository(),
    rows: (): Row[] => database.rows(TABLE),
    restore: () => database.restore(),
  };
}

// --- reading ----------------------------------------------------------------

Deno.test("get maps the stored columns back to a schedule union", async () => {
  const h = harness([
    campaign({ email_campaign_id: 1 }),
    campaign({
      email_campaign_id: 2,
      schedule_kind: "once",
      scheduled_at: 5_000,
      cron_expression: null,
      schedule_timezone: "UTC",
    }),
  ]);

  try {
    const cron = await h.campaigns.get(1);
    const once = await h.campaigns.get(2);

    assert(cron.ok && once.ok);
    assertEquals(cron.data.schedule, {
      kind: "cron",
      expression: "0 9 * * *",
      timezone: CronTimezone.EuropeParis,
    });
    assertEquals(once.data.schedule, { kind: "once", at: 5_000 });
  } finally {
    h.restore();
  }
});

Deno.test("get answers not-found on an unknown id", async () => {
  const h = harness([campaign()]);
  try {
    const res = await h.campaigns.get(999);
    assert(!res.ok);
    assertEquals(res.error, EmailCampaignError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("due() returns only active campaigns whose next run has passed", async () => {
  const h = harness([
    campaign({ email_campaign_id: 1, next_run_at: 500 }),
    campaign({ email_campaign_id: 2, next_run_at: 5_000 }),
    campaign({ email_campaign_id: 3, next_run_at: 100, is_active: false }),
  ]);

  try {
    const res = await h.campaigns.due(1_000);
    assert(res.ok);
    assertEquals(res.data.map((c) => c.id), [1], "neither the future one nor the inactive one");
  } finally {
    h.restore();
  }
});

Deno.test("list can restrict to active campaigns", async () => {
  const h = harness([
    campaign({ email_campaign_id: 1, is_active: true }),
    campaign({ email_campaign_id: 2, is_active: false }),
  ]);

  try {
    const all = await h.campaigns.list();
    const active = await h.campaigns.list({ activeOnly: true });

    assert(all.ok && active.ok);
    assertEquals(all.data.items.length, 2);
    assertEquals(active.data.items.map((c) => c.id), [1]);
  } finally {
    h.restore();
  }
});

// --- creation ---------------------------------------------------------------

Deno.test("create computes next_run_at from the cron expression", async () => {
  const h = harness();

  try {
    const res = await h.campaigns.create({ emailTemplateId: 10, schedule: DAILY });

    assert(res.ok);
    assert(res.data.nextRunAt !== null);
    assert(res.data.nextRunAt > Date.now(), "the next occurrence is in the future");
    assertEquals(h.rows()[0].schedule_kind, "cron");
    assertEquals(h.rows()[0].cron_expression, "0 9 * * *");
  } finally {
    h.restore();
  }
});

Deno.test("create refuses a malformed cron expression without writing", async () => {
  const h = harness();

  try {
    const res = await h.campaigns.create({
      emailTemplateId: 10,
      schedule: { kind: "cron", expression: "pas une expression", timezone: CronTimezone.Utc },
    });

    assert(!res.ok);
    assertEquals(res.error, EmailCampaignError.InvalidSchedule);
    assertEquals(h.rows().length, 0, "nothing is written when the schedule is refused");
  } finally {
    h.restore();
  }
});

Deno.test("create refuses a `once` schedule with a nonsense date", async () => {
  const h = harness();
  try {
    const res = await h.campaigns.create({
      emailTemplateId: 10,
      schedule: { kind: "once", at: -1 },
    });
    assert(!res.ok);
    assertEquals(res.error, EmailCampaignError.InvalidSchedule);
  } finally {
    h.restore();
  }
});

Deno.test("create serialises the typed filters into their snake_case columns", async () => {
  const h = harness();

  try {
    const res = await h.campaigns.create({
      emailTemplateId: 10,
      schedule: DAILY,
      filters: { isEmailVerified: true, inactiveDays: 30 },
    });

    assert(res.ok);
    const filters = h.rows()[0].filters as Record<string, unknown>;
    assertEquals(filters.is_email_verified, true);
    assertEquals(filters.inactive_days, 30);
    assertEquals(filters.device_os, null, "filters that were not given are explicitly null");
  } finally {
    h.restore();
  }
});

// --- update -----------------------------------------------------------------

Deno.test("update answers not-found instead of silently doing nothing", async () => {
  const h = harness([campaign()]);

  try {
    const update = await h.campaigns.update(999, { data: { a: 1 } });
    const setActive = await h.campaigns.setActive(999, false);
    const remove = await h.campaigns.remove(999);

    assert(!update.ok && !setActive.ok && !remove.ok);
    assertEquals(update.error, EmailCampaignError.NotFound);
    assertEquals(setActive.error, EmailCampaignError.NotFound);
    assertEquals(remove.error, EmailCampaignError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("extraFilters merges into the existing filters instead of wiping them", async () => {
  const h = harness([
    campaign({ filters: { is_email_verified: true, country: "FR", segment: "vip" } }),
  ]);

  try {
    const res = await h.campaigns.update(1, { extraFilters: { segment: "gold" } });
    assert(res.ok);

    const filters = h.rows()[0].filters as Record<string, unknown>;
    assertEquals(filters.is_email_verified, true, "the generic filters survive");
    assertEquals(filters.country, "FR");
    assertEquals(filters.segment, "gold", "the project key is replaced");
  } finally {
    h.restore();
  }
});

Deno.test("passing typed filters replaces the generic block, extra keys ride along", async () => {
  const h = harness([campaign({ filters: { country: "FR", segment: "vip" } })]);

  try {
    const res = await h.campaigns.update(1, {
      filters: { country: "BE" },
      extraFilters: { segment: "vip" },
    });
    assert(res.ok);

    const filters = h.rows()[0].filters as Record<string, unknown>;
    assertEquals(filters.country, "BE");
    assertEquals(filters.segment, "vip");
  } finally {
    h.restore();
  }
});

Deno.test("changing the schedule recomputes next_run_at", async () => {
  const h = harness([campaign({ next_run_at: 1_000 })]);

  try {
    const res = await h.campaigns.update(1, {
      schedule: { kind: "cron", expression: "0 8 * * 1", timezone: CronTimezone.EuropeParis },
    });
    assert(res.ok);

    const row = h.rows()[0];
    assertEquals(row.cron_expression, "0 8 * * 1");
    assert((row.next_run_at as number) > Date.now());
  } finally {
    h.restore();
  }
});

Deno.test("update refuses an invalid schedule before touching the row", async () => {
  const h = harness([campaign({ cron_expression: "0 9 * * *" })]);

  try {
    const res = await h.campaigns.update(1, {
      schedule: { kind: "cron", expression: "@@@", timezone: CronTimezone.Utc },
    });

    assert(!res.ok);
    assertEquals(res.error, EmailCampaignError.InvalidSchedule);
    assertEquals(h.rows()[0].cron_expression, "0 9 * * *", "the row is untouched");
  } finally {
    h.restore();
  }
});

// --- execution --------------------------------------------------------------

Deno.test("markRan advances a recurring campaign and keeps it active", async () => {
  const h = harness([campaign({ next_run_at: 1_000 })]);
  const ranAt = Date.now();

  try {
    const res = await h.campaigns.markRan(1, ranAt);
    assert(res.ok);

    const row = h.rows()[0];
    assertEquals(row.last_run_at, ranAt);
    assert((row.next_run_at as number) > ranAt, "the next occurrence is scheduled again");
    assertEquals(row.is_active, true);
  } finally {
    h.restore();
  }
});

Deno.test("markRan deactivates a `once` campaign, it never fires twice", async () => {
  const at = Date.now() - 1_000;
  const h = harness([
    campaign({ schedule_kind: "once", scheduled_at: at, cron_expression: null, next_run_at: at }),
  ]);

  try {
    const res = await h.campaigns.markRan(1, Date.now());
    assert(res.ok);

    const row = h.rows()[0];
    assertEquals(row.next_run_at, null);
    assertEquals(row.is_active, false);
  } finally {
    h.restore();
  }
});

Deno.test("markRan answers not-found on an unknown campaign", async () => {
  const h = harness([campaign()]);
  try {
    const res = await h.campaigns.markRan(999, Date.now());
    assert(!res.ok);
    assertEquals(res.error, EmailCampaignError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("remove deletes the row and leaves the others alone", async () => {
  const h = harness([campaign({ email_campaign_id: 1 }), campaign({ email_campaign_id: 2 })]);

  try {
    const res = await h.campaigns.remove(1);
    assert(res.ok);
    assertEquals(h.rows().map((r) => r.email_campaign_id), [2]);
  } finally {
    h.restore();
  }
});
