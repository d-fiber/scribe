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

import { AdminPushCampaignCreateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/campaign/create.ts";
import {
  AdminPushCampaignDueEndpoint,
  AdminPushCampaignListEndpoint,
} from "@scribe/host/api/public/admin/src/features/messaging/push/campaign/list.ts";
import { AdminPushCampaignStatusEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/campaign/status.ts";
import { AdminPushCampaignUpdateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/campaign/update.ts";
import { AdminPushNotificationDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/notification/delete.ts";
import { AdminPushNotificationListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/notification/list.ts";
import { AdminPushOpenListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/open/list.ts";
import { AdminPushTemplateCreateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/template/create.ts";
import { AdminPushTemplateDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/template/delete.ts";
import { AdminPushTemplateListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/template/list.ts";
import { AdminPushTemplateReadByNameEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/template/read.ts";
import { AdminPushTemplateUpdateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/push/template/update.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";

const ADMIN = {
  id: "admin-1",
  email: "admin@example.com",
  rules: { role: "owner", permissions: [] },
};

const USER_WITHOUT_RULES = { id: "user-1", email: "user@example.com" };

const NOTIFICATION_ID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
const FUTURE = 4_102_444_800_000;

function signedIn(extra: Record<string, unknown> = {}) {
  return { identity: ADMIN, device: fakeDevice(), ...extra };
}

function templates(): Row[] {
  return [
    { push_template_id: 1, name: "welcome", title: "Bienvenue", body: "Body", data: null },
    { push_template_id: 2, name: "app/promo", title: "Promo", body: "Body", data: null },
  ];
}

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
  ];
}

function pushes(): Row[] {
  return [
    {
      push_id: 50,
      notification_id: NOTIFICATION_ID,
      device_id: "device-1",
      status: "sent",
      error: null,
      created_at: 10,
      updated_at: 10,
    },
    {
      push_id: 51,
      notification_id: NOTIFICATION_ID,
      device_id: "device-2",
      status: "failed",
      error: "UNREGISTERED",
      created_at: 20,
      updated_at: 20,
    },
  ];
}

function opens(): Row[] {
  return [
    { open_id: 100, push_id: 50, created_at: 30 },
    { open_id: 101, push_id: 51, created_at: 40 },
  ];
}

function harness() {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__push_templates: templates(),
    internal_t__push_campaigns: campaigns(),
    internal_t__notification_pushes: pushes(),
    internal_t__notification_push_opens: opens(),
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

// --- template ----------------------------------------------------------------

Deno.test("GET /push/template: lists, and refuses a caller without rules", async () => {
  const h = harness();
  try {
    const ok = await callEndpoint(
      () => AdminPushTemplateListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(ok.status, 200);
    assertEquals((ok.body.data as { templates: unknown[] }).templates.length, 2);

    const refused = await callEndpoint(
      () => AdminPushTemplateListEndpoint.handle(),
      {},
      { identity: USER_WITHOUT_RULES, device: fakeDevice(), method: "GET" },
    );
    assertEquals(refused.status, 401);
  } finally {
    h.restore();
  }
});

Deno.test("GET /push/template/by-name: resolves a slash-separated name", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushTemplateReadByNameEndpoint.handle("app/promo"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    assertEquals((res.body.data as { id: number }).id, 2);
  } finally {
    h.restore();
  }
});

Deno.test("POST /push/template: title and body are both required", async () => {
  const h = harness();
  try {
    const noTitle = await callEndpoint(
      () => AdminPushTemplateCreateEndpoint.handle(),
      { name: "x", body: "b" },
      signedIn(),
    );
    assertEquals(noTitle.status, 400);
    assertEquals(noTitle.body.code, "invalid_title");

    const noBody = await callEndpoint(
      () => AdminPushTemplateCreateEndpoint.handle(),
      { name: "x", title: "t" },
      signedIn(),
    );
    assertEquals(noBody.status, 400);
    assertEquals(noBody.body.code, "invalid_body");

    assertEquals(h.rest.rows("internal_t__push_templates").length, 2);
  } finally {
    h.restore();
  }
});

Deno.test("POST /push/template: creates with an optional data payload", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushTemplateCreateEndpoint.handle(),
      { name: "reminder", title: "Rappel", body: "Body", data: { type: "reminder" } },
      signedIn(),
    );

    assertEquals(res.status, 201);
    assertEquals(h.rest.rows("internal_t__push_templates").length, 3);
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /push/template/:id: 404 on an unknown id, empty patch refused", async () => {
  const h = harness();
  try {
    const missing = await callEndpoint(
      () => AdminPushTemplateUpdateEndpoint.handle("404"),
      { title: "changed" },
      signedIn({ method: "PATCH" }),
    );
    assertEquals(missing.status, 404);

    const empty = await callEndpoint(
      () => AdminPushTemplateUpdateEndpoint.handle("1"),
      {},
      signedIn({ method: "PATCH" }),
    );
    assertEquals(empty.status, 400);
    assertEquals(empty.body.code, "empty_patch");
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /push/template/:id: 404 on an unknown id", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushTemplateDeleteEndpoint.handle("404"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(h.rest.rows("internal_t__push_templates").length, 2);
  } finally {
    h.restore();
  }
});

// --- campaign ----------------------------------------------------------------

Deno.test("GET /push/campaign: the payload carries no audience", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushCampaignListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { campaigns: list } = res.body.data as { campaigns: Record<string, unknown>[] };
    assertEquals(list.length, 1);
    assert(
      !("audience" in list[0]),
      "push cannot target admins: admin_users_devices has no notification_token",
    );
    assertEquals(list[0].schedule, { kind: "once", at: FUTURE });
  } finally {
    h.restore();
  }
});

Deno.test("GET /push/campaign/due: reads next_run_at", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushCampaignDueEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    assertEquals(
      (res.body.data as { campaigns: unknown[] }).campaigns.length,
      0,
      "the only campaign runs in 2100",
    );
  } finally {
    h.restore();
  }
});

Deno.test("POST /push/campaign: an unknown template is a 422", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushCampaignCreateEndpoint.handle(),
      { push_template_id: 999, schedule: { kind: "once", at: FUTURE } },
      signedIn(),
    );

    assertEquals(res.status, 422);
    assertEquals(res.body.code, "template_not_found");
    assertEquals(h.rest.rows("internal_t__push_campaigns").length, 1);
  } finally {
    h.restore();
  }
});

Deno.test("POST /push/campaign: a malformed schedule is refused", async () => {
  const h = harness();
  const cases: unknown[] = [
    undefined,
    { kind: "weekly" },
    { kind: "once" },
    { kind: "cron", expression: "0 9 * * 1" },
    { kind: "cron", expression: "0 9 * * 1", timezone: "Mars/Olympus" },
  ];

  try {
    for (const schedule of cases) {
      const res = await callEndpoint(
        () => AdminPushCampaignCreateEndpoint.handle(),
        { push_template_id: 1, schedule },
        signedIn(),
      );

      assertEquals(res.status, 400, `${JSON.stringify(schedule)} must be refused`);
      assertEquals(res.body.code, "invalid_schedule");
    }
  } finally {
    h.restore();
  }
});

Deno.test("POST /push/campaign: leaves next_run_at to the SQL trigger", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushCampaignCreateEndpoint.handle(),
      {
        push_template_id: 1,
        schedule: { kind: "cron", expression: "0 9 * * 1", timezone: "Europe/Paris" },
      },
      signedIn(),
    );

    assertEquals(res.status, 201);
    const created = h.rest
      .rows("internal_t__push_campaigns")
      .find((row) => row.push_campaign_id !== 10);

    assertEquals(created?.cron_expression, "0 9 * * 1");
    assertEquals(
      created?.next_run_at,
      undefined,
      "push_campaigns_set_next_run owns that column, the API never writes it",
    );
  } finally {
    h.restore();
  }
});

Deno.test("POST /push/campaign: an unknown filter key is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushCampaignCreateEndpoint.handle(),
      {
        push_template_id: 1,
        schedule: { kind: "once", at: FUTURE },
        filters: { deviceOs: "ios" },
      },
      signedIn(),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_filters");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /push/campaign/:id/status: toggles, refuses a non-boolean", async () => {
  const h = harness();
  try {
    const ok = await callEndpoint(
      () => AdminPushCampaignStatusEndpoint.handle("10"),
      { is_active: false },
      signedIn({ method: "PATCH" }),
    );
    assertEquals(ok.status, 200);
    assertEquals(
      h.rest.rows("internal_t__push_campaigns").find((r) => r.push_campaign_id === 10)?.is_active,
      false,
    );

    const bad = await callEndpoint(
      () => AdminPushCampaignStatusEndpoint.handle("10"),
      { is_active: "no" },
      signedIn({ method: "PATCH" }),
    );
    assertEquals(bad.status, 400);
    assertEquals(bad.body.code, "invalid_is_active");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /push/campaign/:id: 404 on an unknown id", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushCampaignUpdateEndpoint.handle("404"),
      { is_active: false },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 404);
  } finally {
    h.restore();
  }
});

// --- notification (deliveries) ----------------------------------------------

Deno.test("GET /push/notification/source/:id: one row per targeted device", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushNotificationListEndpoint.handle(NOTIFICATION_ID),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { notifications } = res.body.data as {
      notifications: { id: number; status: string; error: string | null }[];
    };
    assertEquals(notifications.map((n) => n.id).sort(), [50, 51]);
    assertEquals(
      notifications.find((n) => n.id === 51)?.error,
      "UNREGISTERED",
      "a dead token is visible from the admin surface",
    );
  } finally {
    h.restore();
  }
});

Deno.test("GET /push/notification/source/:id: a non-UUID source is a 400", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushNotificationListEndpoint.handle("42"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(
      res.status,
      400,
      "in_app_notifications.notification_id is a uuid, not a serial",
    );
    assertEquals(res.body.code, "invalid_notificationId");
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /push/notification/:id: 404 on an unknown id", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushNotificationDeleteEndpoint.handle("404"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(h.rest.rows("internal_t__notification_pushes").length, 2);
  } finally {
    h.restore();
  }
});

// --- open --------------------------------------------------------------------

Deno.test("GET /push/open/notification/:id: only the opens of that delivery", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushOpenListEndpoint.handle("50"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { opens: list } = res.body.data as { opens: { id: number }[] };
    assertEquals(list.map((open) => open.id), [100]);
  } finally {
    h.restore();
  }
});

Deno.test("GET /push/open/notification/:id: an unknown delivery is a 404", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminPushOpenListEndpoint.handle("404"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(
      res.status,
      404,
      "'unknown delivery' and 'delivery never opened' must not look the same",
    );
  } finally {
    h.restore();
  }
});
