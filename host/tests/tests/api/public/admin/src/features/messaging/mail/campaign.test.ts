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

import { AdminEmailCampaignCreateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/campaign/create.ts";
import { AdminEmailCampaignDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/campaign/delete.ts";
import {
  AdminEmailCampaignDueEndpoint,
  AdminEmailCampaignListEndpoint,
} from "@scribe/host/api/public/admin/src/features/messaging/mail/campaign/list.ts";
import { AdminEmailCampaignStatusEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/campaign/status.ts";
import { AdminEmailCampaignUpdateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/campaign/update.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assertEquals } from "@std/assert";

const ADMIN = {
  id: "admin-1",
  email: "admin@example.com",
  rules: { role: "owner", permissions: [] },
};

const FUTURE = 4_102_444_800_000;

function signedIn(extra: Record<string, unknown> = {}) {
  return { identity: ADMIN, device: fakeDevice(), ...extra };
}

function templates(): Row[] {
  return [{ email_template_id: 1, name: "welcome", subject: "Hi", html: null, text: "Hi" }];
}

function campaigns(): Row[] {
  return [
    {
      email_campaign_id: 10,
      email_template_id: 1,
      audience: "user",
      schedule_kind: "once",
      scheduled_at: FUTURE,
      cron_expression: null,
      schedule_timezone: "UTC",
      filters: null,
      data: null,
      is_active: true,
      next_run_at: FUTURE,
      last_run_at: null,
      created_at: 1,
      updated_at: 1,
    },
    {
      email_campaign_id: 11,
      email_template_id: 1,
      audience: "admin",
      schedule_kind: "cron",
      scheduled_at: null,
      cron_expression: "0 9 * * 1",
      schedule_timezone: "Europe/Paris",
      filters: { device_os: "ios" },
      data: null,
      is_active: false,
      next_run_at: 1,
      last_run_at: null,
      created_at: 1,
      updated_at: 1,
    },
  ];
}

function harness() {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__email_templates: templates(),
    internal_t__email_campaigns: campaigns(),
  });
  const env = installAuthEnv();

  return {
    rest,
    restore() {
      env.restore();
      rest.restore();
      gotrue.restore();
    },
  };
}

function createBody(overrides: Record<string, unknown> = {}) {
  return {
    email_template_id: 1,
    schedule: { kind: "once", at: FUTURE },
    ...overrides,
  };
}

Deno.test("GET /campaign: both schedule shapes round-trip to the payload", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { campaigns: list } = res.body.data as {
      campaigns: { id: number; schedule: Record<string, unknown> }[];
    };

    assertEquals(list.find((c) => c.id === 10)?.schedule, { kind: "once", at: FUTURE });
    assertEquals(list.find((c) => c.id === 11)?.schedule, {
      kind: "cron",
      expression: "0 9 * * 1",
      timezone: "Europe/Paris",
    });
  } finally {
    h.restore();
  }
});

Deno.test("GET /campaign/due: only returns what the cron would pick up", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignDueEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { campaigns: due } = res.body.data as { campaigns: { id: number }[] };
    assertEquals(
      due.map((c) => c.id),
      [],
      "campaign 11 is due by date but inactive, campaign 10 runs in 2100",
    );
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: creates from a once schedule", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody(),
      signedIn(),
    );

    assertEquals(res.status, 201);
    assertEquals(h.rest.rows("internal_t__email_campaigns").length, 3);
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: an unknown template is a 422, not a 500", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody({ email_template_id: 999 }),
      signedIn(),
    );

    assertEquals(res.status, 422);
    assertEquals(res.body.code, "template_not_found");
    assertEquals(h.rest.rows("internal_t__email_campaigns").length, 2, "nothing written");
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: a malformed schedule is refused", async () => {
  const h = harness();
  const cases: unknown[] = [
    undefined,
    { kind: "weekly" },
    { kind: "once" },
    { kind: "once", at: -1 },
    { kind: "cron", expression: "0 9 * * 1" },
    { kind: "cron", expression: "0 9 * * 1", timezone: "Mars/Olympus" },
    { kind: "cron", timezone: "UTC" },
  ];

  try {
    for (const schedule of cases) {
      const res = await callEndpoint(
        () => AdminEmailCampaignCreateEndpoint.handle(),
        createBody({ schedule }),
        signedIn(),
      );

      assertEquals(res.status, 400, `${JSON.stringify(schedule)} must be refused`);
      assertEquals(res.body.code, "invalid_schedule");
    }
    assertEquals(h.rest.rows("internal_t__email_campaigns").length, 2);
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: a cron expression that never fires is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody({
        schedule: { kind: "cron", expression: "not a cron", timezone: "UTC" },
      }),
      signedIn(),
    );

    assertEquals(res.status, 400);
    assertEquals(
      res.body.code,
      "invalid_schedule",
      "InvalidSchedule from the client must not surface as a 500",
    );
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: filters are mapped from snake_case to the client shape", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody({
        filters: {
          device_os: "ios",
          app_version_min: "1.2.0",
          is_email_verified: true,
          inactive_days: 30,
        },
      }),
      signedIn(),
    );

    assertEquals(res.status, 201);
    const created = h.rest
      .rows("internal_t__email_campaigns")
      .find((row) => row.email_campaign_id !== 10 && row.email_campaign_id !== 11);

    assertEquals((created?.filters as Record<string, unknown>).device_os, "ios");
    assertEquals((created?.filters as Record<string, unknown>).app_version_min, "1.2.0");
    assertEquals((created?.filters as Record<string, unknown>).is_email_verified, true);
    assertEquals((created?.filters as Record<string, unknown>).inactive_days, 30);
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: an unknown filter key is refused instead of silently dropped", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody({ filters: { deviceOs: "ios" } }),
      signedIn(),
    );

    assertEquals(
      res.status,
      400,
      "camelCase is the client shape, not the wire shape: it must not pass silently",
    );
    assertEquals(res.body.code, "invalid_filters");
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: filter values are type-checked", async () => {
  const h = harness();
  const cases = [
    { device_os: "symbian" },
    { localization: "kl" },
    { is_email_verified: "yes" },
    { inactive_days: -3 },
    { created_after: "2026-01-01" },
    { country: "" },
  ];

  try {
    for (const filters of cases) {
      const res = await callEndpoint(
        () => AdminEmailCampaignCreateEndpoint.handle(),
        createBody({ filters }),
        signedIn(),
      );

      assertEquals(res.status, 400, `${JSON.stringify(filters)} must be refused`);
      assertEquals(res.body.code, "invalid_filters");
    }
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: a null filter value clears the criterion", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody({ filters: { device_os: null, country: "FR" } }),
      signedIn(),
    );

    assertEquals(res.status, 201, "null means 'no such criterion', not 'invalid value'");
  } finally {
    h.restore();
  }
});

Deno.test("POST /campaign: an unknown audience is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignCreateEndpoint.handle(),
      createBody({ audience: "everyone" }),
      signedIn(),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_audience");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /campaign/:id: an empty patch is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignUpdateEndpoint.handle("10"),
      {},
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "empty_patch");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /campaign/:id: 404 on an unknown id", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignUpdateEndpoint.handle("404"),
      { is_active: false },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /campaign/:id: the template is validated before the write", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignUpdateEndpoint.handle("10"),
      { email_template_id: 999 },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 422);
    assertEquals(res.body.code, "template_not_found");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /campaign/:id/status: toggles is_active", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignStatusEndpoint.handle("10"),
      { is_active: false },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 200);
    const row = h.rest
      .rows("internal_t__email_campaigns")
      .find((r) => r.email_campaign_id === 10);
    assertEquals(row?.is_active, false);
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /campaign/:id/status: a non-boolean is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignStatusEndpoint.handle("10"),
      { is_active: "false" },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_is_active");
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /campaign/:id: 404 on an unknown id", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailCampaignDeleteEndpoint.handle("404"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(h.rest.rows("internal_t__email_campaigns").length, 2);
  } finally {
    h.restore();
  }
});
