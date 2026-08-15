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

import { AdminDynamicLinkCreateEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/link/create.ts";
import { AdminDynamicLinkDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/link/delete.ts";
import { AdminDynamicLinkListEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/link/list.ts";
import { AdminDynamicLinkReadEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/link/read.ts";
import { AdminDynamicLinkUpdateEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/link/update.ts";
import { AdminDynamicLinkStatisticsListEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/statistics/list.ts";
import { AdminDynamicLinkStatisticsReadEndpoint } from "@scribe/host/api/public/admin/src/features/devops/dynamic-link/statistics/read.ts";
import {
  DYNAMIC_LINK_PAYLOAD_VERSION,
  DynamicLinkKind,
  DynamicLinkOutcome,
  type DynamicLinkPayload,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import type { SessionAdmin } from "@scribe/core/contracts/account.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { installRateLimiterMock, installValkeryMock } from "@scribe/core/testing/runtime/redis.ts";
import { assert, assertEquals } from "@std/assert";

const TABLE = "internal_t__dynamic_links";
const STATS_TABLE = "internal_t__dynamic_link_statistics";
const BASE = "/features/devops/dynamic-link";

const ADMIN: SessionAdmin = {
  id: "admin-1",
  email: "a1@example.com",
  rules: { role: "owner", permissions: [] },
};

const DEEPLINK: DynamicLinkPayload = {
  v: DYNAMIC_LINK_PAYLOAD_VERSION,
  kind: DynamicLinkKind.Deeplink,
  route: "brand",
  params: { id: "42" },
};

function link(overrides: Partial<Row> = {}): Row {
  return {
    short_link_id: 1,
    slug: "abc123XYZ0",
    payload: { ...DEEPLINK },
    expires_at: null,
    created_at: 1_000,
    updated_at: 1_000,
    ...overrides,
  };
}

function statistic(overrides: Partial<Row> = {}): Row {
  return {
    statistic_id: 10,
    short_link_id: 1,
    user_id: null,
    device_id: null,
    ip_address: null,
    user_agent: null,
    referer: null,
    outcome: DynamicLinkOutcome.Served,
    platform: null,
    created_at: 5_000,
    ...overrides,
  };
}

function harness(links: Row[], statistics: Row[] = []) {
  const rest = installRestMock({ [TABLE]: links, [STATS_TABLE]: statistics });
  const kv = installValkeryMock();
  const rate = installRateLimiterMock();

  return {
    rows: (table: string): Row[] => rest.rows(table),
    restore(): void {
      rate.restore();
      kv.restore();
      rest.restore();
    },
  };
}

function get(path: string, identity?: SessionAdmin) {
  return { method: "GET", path, ...(identity ? { identity } : {}) };
}

Deno.test("the link list carries the slug and the payload of every link", async () => {
  const h = harness([
    link({ short_link_id: 1, slug: "aaaaaaaaaa" }),
    link({ short_link_id: 2, slug: "bbbbbbbbbb" }),
  ]);

  try {
    const res = await callEndpoint(() => AdminDynamicLinkListEndpoint.handle(), {}, get(`${BASE}/link`, ADMIN));

    assertEquals(res.status, 200);
    const links = (res.body.data as { links: { id: number; slug: string; payload: unknown }[] }).links;
    assertEquals(links.map((l) => l.slug).sort(), ["aaaaaaaaaa", "bbbbbbbbbb"]);
    assertEquals(links[0].payload, DEEPLINK);
  } finally {
    h.restore();
  }
});

Deno.test("the list keeps expired links, the single read refuses them", async () => {
  const h = harness([link({ short_link_id: 1, expires_at: 1 })]);

  try {
    const list = await callEndpoint(() => AdminDynamicLinkListEndpoint.handle(), {}, get(`${BASE}/link`, ADMIN));
    const read = await callEndpoint(() => AdminDynamicLinkReadEndpoint.handle("1"), {}, get(`${BASE}/link/1`, ADMIN));

    assertEquals((list.body.data as { links: unknown[] }).links.length, 1, "an expired link stays listable");
    assertEquals(read.status, 409);
    assertEquals(read.body.code, "link_expired");
  } finally {
    h.restore();
  }
});

Deno.test("reading a link by id, and 404/400 on unknown or malformed id", async () => {
  const h = harness([link({ short_link_id: 1, slug: "abc123XYZ0" })]);

  try {
    const found = await callEndpoint(() => AdminDynamicLinkReadEndpoint.handle("1"), {}, get(`${BASE}/link/1`, ADMIN));
    const missing = await callEndpoint(
      () => AdminDynamicLinkReadEndpoint.handle("999"),
      {},
      get(`${BASE}/link/999`, ADMIN),
    );
    const malformed = await callEndpoint(
      () => AdminDynamicLinkReadEndpoint.handle("abc"),
      {},
      get(`${BASE}/link/abc`, ADMIN),
    );

    assertEquals((found.body.data as { slug: string }).slug, "abc123XYZ0");
    assertEquals(missing.status, 404);
    assertEquals(malformed.status, 400);
  } finally {
    h.restore();
  }
});

Deno.test("creating a link generates its slug and echoes the parsed payload", async () => {
  const h = harness([]);

  try {
    const res = await callEndpoint(() => AdminDynamicLinkCreateEndpoint.handle(), { payload: DEEPLINK }, {
      method: "POST",
      path: `${BASE}/link`,
      identity: ADMIN,
    });

    assertEquals(res.status, 201);
    const created = res.body.data as { id: number; slug: string; payload: unknown };
    assert(created.slug.length > 0, "the slug is generated server-side, never sent by the caller");
    assertEquals(created.payload, DEEPLINK);
    assertEquals(h.rows(TABLE).length, 1);
  } finally {
    h.restore();
  }
});

Deno.test("creating refuses an unreadable payload and a malformed expires_at", async () => {
  const h = harness([]);

  try {
    const badPayload = await callEndpoint(
      () => AdminDynamicLinkCreateEndpoint.handle(),
      { payload: { kind: "carrier-pigeon" } },
      { method: "POST", path: `${BASE}/link`, identity: ADMIN },
    );
    const badExpiry = await callEndpoint(
      () => AdminDynamicLinkCreateEndpoint.handle(),
      { payload: DEEPLINK, expires_at: "tomorrow" },
      { method: "POST", path: `${BASE}/link`, identity: ADMIN },
    );

    assertEquals(badPayload.status, 400);
    assertEquals(badPayload.body.code, "invalid_payload");
    assertEquals(badExpiry.status, 400);
    assertEquals(badExpiry.body.code, "invalid_expires_at");
    assertEquals(h.rows(TABLE).length, 0, "nothing is written when the body is refused");
  } finally {
    h.restore();
  }
});

Deno.test("a redirect payload to a non-http scheme is refused at the door", async () => {
  const h = harness([]);

  try {
    const res = await callEndpoint(
      () => AdminDynamicLinkCreateEndpoint.handle(),
      {
        payload: {
          v: DYNAMIC_LINK_PAYLOAD_VERSION,
          kind: DynamicLinkKind.Redirect,
          url: "javascript:alert(1)",
        },
      },
      { method: "POST", path: `${BASE}/link`, identity: ADMIN },
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_payload");
  } finally {
    h.restore();
  }
});

Deno.test("patching applies only the given fields and refuses an empty patch", async () => {
  const h = harness([link({ short_link_id: 1, expires_at: null })]);

  try {
    const patched = await callEndpoint(
      () => AdminDynamicLinkUpdateEndpoint.handle("1"),
      { expires_at: 9_000_000 },
      { method: "PATCH", path: `${BASE}/link/1`, identity: ADMIN },
    );
    const empty = await callEndpoint(
      () => AdminDynamicLinkUpdateEndpoint.handle("1"),
      {},
      { method: "PATCH", path: `${BASE}/link/1`, identity: ADMIN },
    );

    assertEquals(patched.status, 200);
    const row = h.rows(TABLE)[0];
    assertEquals(row.expires_at, 9_000_000);
    assertEquals(row.payload, DEEPLINK, "the payload was not part of the patch");
    assertEquals(empty.status, 400);
    assertEquals(empty.body.code, "empty_patch");
  } finally {
    h.restore();
  }
});

Deno.test("an expired link can still be brought back by patching expires_at", async () => {
  const h = harness([link({ short_link_id: 1, expires_at: 1 })]);

  try {
    const res = await callEndpoint(
      () => AdminDynamicLinkUpdateEndpoint.handle("1"),
      { expires_at: null },
      { method: "PATCH", path: `${BASE}/link/1`, identity: ADMIN },
    );

    assertEquals(res.status, 200, "the write path does not check expiry, only the read path does");
    assertEquals(h.rows(TABLE)[0].expires_at, null);
  } finally {
    h.restore();
  }
});

Deno.test("deleting a link removes the row, and answers 404 on an unknown id", async () => {
  const h = harness([link({ short_link_id: 1 }), link({ short_link_id: 2, slug: "bbbbbbbbbb" })]);

  try {
    const removed = await callEndpoint(() => AdminDynamicLinkDeleteEndpoint.handle("1"), {}, {
      method: "DELETE",
      path: `${BASE}/link/1`,
      identity: ADMIN,
    });
    const missing = await callEndpoint(() => AdminDynamicLinkDeleteEndpoint.handle("999"), {}, {
      method: "DELETE",
      path: `${BASE}/link/999`,
      identity: ADMIN,
    });

    assertEquals(removed.status, 200);
    assertEquals(h.rows(TABLE).map((r) => r.short_link_id), [2]);
    assertEquals(missing.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("the statistics list is scoped to one link", async () => {
  const h = harness(
    [link({ short_link_id: 1 }), link({ short_link_id: 2, slug: "bbbbbbbbbb" })],
    [
      statistic({ statistic_id: 10, short_link_id: 1 }),
      statistic({ statistic_id: 11, short_link_id: 2 }),
      statistic({ statistic_id: 12, short_link_id: 1 }),
    ],
  );

  try {
    const res = await callEndpoint(
      () => AdminDynamicLinkStatisticsListEndpoint.handle("1"),
      {},
      get(`${BASE}/statistics/link/1`, ADMIN),
    );

    assertEquals(res.status, 200);
    const ids = (res.body.data as { statistics: { id: number }[] }).statistics.map((s) => s.id).sort();
    assertEquals(ids, [10, 12]);
  } finally {
    h.restore();
  }
});

Deno.test("the statistics list answers 404 on a link that does not exist", async () => {
  const h = harness([link({ short_link_id: 1 })], [statistic()]);

  try {
    const res = await callEndpoint(
      () => AdminDynamicLinkStatisticsListEndpoint.handle("999"),
      {},
      get(`${BASE}/statistics/link/999`, ADMIN),
    );

    assertEquals(res.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("reading one statistic carries the outcome and the platform recorded", async () => {
  const h = harness(
    [link({ short_link_id: 1 })],
    [statistic({
      statistic_id: 10,
      outcome: DynamicLinkOutcome.OpenedApp,
      platform: "ios",
      referer: "https://x.test",
    })],
  );

  try {
    const found = await callEndpoint(
      () => AdminDynamicLinkStatisticsReadEndpoint.handle("10"),
      {},
      get(`${BASE}/statistics/10`, ADMIN),
    );
    const missing = await callEndpoint(
      () => AdminDynamicLinkStatisticsReadEndpoint.handle("999"),
      {},
      get(`${BASE}/statistics/999`, ADMIN),
    );

    assertEquals(found.status, 200);
    const body = found.body.data as { outcome: string; platform: string; referer: string };
    assertEquals(body.outcome, DynamicLinkOutcome.OpenedApp);
    assertEquals(body.platform, "ios");
    assertEquals(body.referer, "https://x.test");
    assertEquals(missing.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("every dynamic-link endpoint refuses an anonymous caller", async () => {
  const h = harness([link({ short_link_id: 1 })], [statistic()]);

  try {
    const calls = await Promise.all([
      callEndpoint(() => AdminDynamicLinkListEndpoint.handle(), {}, get(`${BASE}/link`)),
      callEndpoint(() => AdminDynamicLinkReadEndpoint.handle("1"), {}, get(`${BASE}/link/1`)),
      callEndpoint(() => AdminDynamicLinkCreateEndpoint.handle(), { payload: DEEPLINK }, {
        method: "POST",
        path: `${BASE}/link`,
      }),
      callEndpoint(() => AdminDynamicLinkUpdateEndpoint.handle("1"), { expires_at: null }, {
        method: "PATCH",
        path: `${BASE}/link/1`,
      }),
      callEndpoint(() => AdminDynamicLinkDeleteEndpoint.handle("1"), {}, {
        method: "DELETE",
        path: `${BASE}/link/1`,
      }),
      callEndpoint(() => AdminDynamicLinkStatisticsListEndpoint.handle("1"), {}, get(`${BASE}/statistics/link/1`)),
      callEndpoint(() => AdminDynamicLinkStatisticsReadEndpoint.handle("10"), {}, get(`${BASE}/statistics/10`)),
    ]);

    assertEquals(calls.map((c) => c.status), calls.map(() => 401));
  } finally {
    h.restore();
  }
});
