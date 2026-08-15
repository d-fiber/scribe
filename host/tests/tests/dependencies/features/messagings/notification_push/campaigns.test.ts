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

import {
  isValidSchedule,
  PushCampaignError,
  PushCampaignRepository,
} from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import { CronTimezone } from "@scribe/core/runtime/event_driven/cron/timezone.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { assert, assertEquals } from "@std/assert";

const FUTURE = 4_102_444_800_000;

function campaigns(): Row[] {
  return [
    {
      push_campaign_id: 10,
      push_template_id: 1,
      schedule_kind: "once",
      scheduled_at: FUTURE,
      cron_expression: null,
      schedule_timezone: "UTC",
      next_run_at: FUTURE,
      last_run_at: null,
      filters: null,
      is_active: true,
      created_at: 1,
      updated_at: 1,
    },
    {
      push_campaign_id: 11,
      push_template_id: 1,
      schedule_kind: "cron",
      scheduled_at: null,
      cron_expression: "0 9 * * 1",
      schedule_timezone: "Europe/Paris",
      next_run_at: 1_000,
      last_run_at: null,
      filters: { device_os: "ios" },
      is_active: true,
      created_at: 1,
      updated_at: 1,
    },
  ];
}

function harness() {
  const rest = installRestMock({ internal_t__push_campaigns: campaigns() });
  return { rest, repository: new PushCampaignRepository() };
}

// --- schedule validation -----------------------------------------------------

Deno.test("isValidSchedule: accepts both shapes", () => {
  assert(isValidSchedule({ kind: "once", at: FUTURE }));
  assert(isValidSchedule({
    kind: "cron",
    expression: "0 9 * * 1",
    timezone: CronTimezone.EuropeParis,
  }));
});

Deno.test("isValidSchedule: rejects what would never fire", () => {
  assert(!isValidSchedule({ kind: "once", at: 0 }));
  assert(!isValidSchedule({ kind: "once", at: -1 }));
  assert(!isValidSchedule({ kind: "once", at: 1.5 }));
  assert(
    !isValidSchedule({
      kind: "cron",
      expression: "not a cron",
      timezone: CronTimezone.Utc,
    }),
  );
});

// --- reads -------------------------------------------------------------------

Deno.test("get: maps both schedule shapes back to the union", async () => {
  const h = harness();
  try {
    const once = await h.repository.get(10);
    assert(once.ok);
    assertEquals(once.data.schedule, { kind: "once", at: FUTURE });

    const cron = await h.repository.get(11);
    assert(cron.ok);
    assertEquals(cron.data.schedule, {
      kind: "cron",
      expression: "0 9 * * 1",
      timezone: CronTimezone.EuropeParis,
    });
  } finally {
    h.rest.restore();
  }
});

Deno.test("get: an unknown id is NotFound", async () => {
  const h = harness();
  try {
    const result = await h.repository.get(404);
    assert(!result.ok);
    assertEquals(result.error, PushCampaignError.NotFound);
  } finally {
    h.rest.restore();
  }
});

Deno.test("due: reads next_run_at, not the schedule columns", async () => {
  const h = harness();
  try {
    const result = await h.repository.due(2_000);
    assert(result.ok);
    assertEquals(
      result.data.map((campaign) => campaign.id),
      [11],
      "only the campaign whose next_run_at has passed",
    );
  } finally {
    h.rest.restore();
  }
});

Deno.test("list: activeOnly narrows the page", async () => {
  const h = harness();
  h.rest.seed("internal_t__push_campaigns", [
    ...campaigns(),
    { ...campaigns()[0], push_campaign_id: 12, is_active: false },
  ]);

  try {
    const all = await h.repository.list();
    assert(all.ok);
    assertEquals(all.data.items.length, 3);

    const active = await h.repository.list({ activeOnly: true });
    assert(active.ok);
    assertEquals(active.data.items.map((c) => c.id).sort(), [10, 11]);
  } finally {
    h.rest.restore();
  }
});

// --- writes ------------------------------------------------------------------

Deno.test("create: refuses an invalid schedule before touching the table", async () => {
  const h = harness();
  try {
    const result = await h.repository.create({
      pushTemplateId: 1,
      schedule: { kind: "cron", expression: "nope", timezone: CronTimezone.Utc },
    });

    assert(!result.ok);
    assertEquals(result.error, PushCampaignError.InvalidSchedule);
    assertEquals(h.rest.rows("internal_t__push_campaigns").length, 2);
  } finally {
    h.rest.restore();
  }
});

Deno.test("create: writes the schedule columns and leaves next_run_at to the trigger", async () => {
  const h = harness();
  try {
    const result = await h.repository.create({
      pushTemplateId: 1,
      schedule: {
        kind: "cron",
        expression: "0 9 * * 1",
        timezone: CronTimezone.EuropeParis,
      },
    });

    assert(result.ok);
    const row = h.rest
      .rows("internal_t__push_campaigns")
      .find((r) => r.push_campaign_id !== 10 && r.push_campaign_id !== 11);

    assertEquals(row?.schedule_kind, "cron");
    assertEquals(row?.cron_expression, "0 9 * * 1");
    assertEquals(row?.schedule_timezone, "Europe/Paris");
    assertEquals(row?.scheduled_at, null);
    assertEquals(
      row?.next_run_at,
      undefined,
      "next_run_at is computed by push_campaigns_set_next_run, never written from here",
    );
  } finally {
    h.rest.restore();
  }
});

Deno.test("create: a once schedule clears the cron columns", async () => {
  const h = harness();
  try {
    const result = await h.repository.create({
      pushTemplateId: 1,
      schedule: { kind: "once", at: FUTURE },
    });

    assert(result.ok);
    const row = h.rest
      .rows("internal_t__push_campaigns")
      .find((r) => r.push_campaign_id !== 10 && r.push_campaign_id !== 11);

    assertEquals(row?.schedule_kind, "once");
    assertEquals(row?.scheduled_at, FUTURE);
    assertEquals(row?.cron_expression, null);
  } finally {
    h.rest.restore();
  }
});

Deno.test("create: filters are serialised to the snake_case jsonb shape", async () => {
  const h = harness();
  try {
    await h.repository.create({
      pushTemplateId: 1,
      schedule: { kind: "once", at: FUTURE },
      filters: { appVersionMin: "1.2.0", inactiveDays: 30 },
    });

    const row = h.rest
      .rows("internal_t__push_campaigns")
      .find((r) => r.push_campaign_id !== 10 && r.push_campaign_id !== 11);
    const filters = row?.filters as Record<string, unknown>;

    assertEquals(filters.app_version_min, "1.2.0");
    assertEquals(filters.inactive_days, 30);
    assertEquals(
      filters.device_os,
      null,
      "an unset criterion is written as null, which resolve_push_campaign_audience reads as 'no filter'",
    );
  } finally {
    h.rest.restore();
  }
});

Deno.test("update: an unknown id is NotFound, not a silent OK", async () => {
  const h = harness();
  try {
    const result = await h.repository.update(404, { isActive: false });

    assert(!result.ok);
    assertEquals(
      result.error,
      PushCampaignError.NotFound,
      "QueryBuilder.update() returns true on zero rows: the repository must pre-read",
    );
  } finally {
    h.rest.restore();
  }
});

Deno.test("update: extraFilters merge with the stored filters instead of replacing them", async () => {
  const h = harness();
  try {
    const result = await h.repository.update(11, { extraFilters: { city: "Paris" } });
    assert(result.ok);

    const row = h.rest
      .rows("internal_t__push_campaigns")
      .find((r) => r.push_campaign_id === 11);
    const filters = row?.filters as Record<string, unknown>;

    assertEquals(filters.city, "Paris");
    assertEquals(filters.device_os, "ios", "the existing criterion survives");
  } finally {
    h.rest.restore();
  }
});

Deno.test("update: an invalid schedule is refused", async () => {
  const h = harness();
  try {
    const result = await h.repository.update(10, {
      schedule: { kind: "once", at: -1 },
    });

    assert(!result.ok);
    assertEquals(result.error, PushCampaignError.InvalidSchedule);
  } finally {
    h.rest.restore();
  }
});

Deno.test("setActive: an unknown id is NotFound", async () => {
  const h = harness();
  try {
    const missing = await h.repository.setActive(404, false);
    assert(!missing.ok);
    assertEquals(missing.error, PushCampaignError.NotFound);

    const found = await h.repository.setActive(10, false);
    assert(found.ok);
    assertEquals(
      h.rest.rows("internal_t__push_campaigns").find((r) => r.push_campaign_id === 10)?.is_active,
      false,
    );
  } finally {
    h.rest.restore();
  }
});

Deno.test("markRan: delegates to the shared SQL function", async () => {
  const h = harness();
  const calls: Record<string, unknown>[] = [];
  h.rest.onRpc("mark_push_campaign_ran", (args) => {
    calls.push(args ?? {});
    return true;
  });

  try {
    const result = await h.repository.markRan(10, 1_700_000_000_000);

    assert(result.ok);
    assertEquals(calls.length, 1);
    assertEquals(calls[0].p_campaign_id, 10);
    assertEquals(calls[0].p_ran_at, 1_700_000_000_000);
  } finally {
    h.rest.restore();
  }
});

Deno.test("markRan: an unknown campaign is NotFound", async () => {
  const h = harness();
  h.rest.onRpc("mark_push_campaign_ran", () => false);

  try {
    const result = await h.repository.markRan(404, 1);
    assert(!result.ok);
    assertEquals(result.error, PushCampaignError.NotFound);
  } finally {
    h.rest.restore();
  }
});

Deno.test("remove: an unknown id is NotFound, not a silent OK", async () => {
  const h = harness();
  try {
    const missing = await h.repository.remove(404);
    assert(!missing.ok);
    assertEquals(missing.error, PushCampaignError.NotFound);
    assertEquals(h.rest.rows("internal_t__push_campaigns").length, 2);

    const removed = await h.repository.remove(10);
    assert(removed.ok);
    assertEquals(h.rest.rows("internal_t__push_campaigns").length, 1);
  } finally {
    h.rest.restore();
  }
});
