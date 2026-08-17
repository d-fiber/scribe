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

import { AdminRemoteConfigCreateEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/config/create.ts";
import { AdminRemoteConfigDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/config/delete.ts";
import { AdminRemoteConfigListEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/config/list.ts";
import { AdminRemoteConfigReadEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/config/read.ts";
import { AdminRemoteConfigUpdateEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/config/update.ts";
import { AdminRemoteConfigStatisticsListEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/statistics/list.ts";
import { AdminRemoteConfigStatisticsReadEndpoint } from "@scribe/host/api/public/admin/src/features/devops/remote-config/statistics/read.ts";
import { APP_REMOTE_CONFIG_CODES } from "@scribe/host/api/public/app/src/features/devops/remote-config/_shared.ts";
import { AppRemoteConfigReadEndpoint } from "@scribe/host/api/public/app/src/features/devops/remote-config/read.ts";
import type { SessionAdmin, SessionUser } from "@scribe/core/contracts/account.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import {
  type RecordRemoteConfigStatisticInput,
  RemoteConfigOutcome,
} from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import { RemoteConfigAudience } from "@scribe/core/contracts/enums.ts";
import { remoteConfigStatisticsQueue } from "@scribe/host/dependencies/features/devops/remote-configs/statistics/_queue.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { installRateLimiterMock } from "@scribe/core/testing/runtime/redis.ts";
import { assertEquals } from "@std/assert";

const TABLE = "internal_t__remote_configs";
const STATS_TABLE = "internal_t__remote_config_statistics";
const RPC = "visible_remote_config_audiences";
const KEY = "feature.flags";
const HASH = "8f1c2ad3";

const AUDIENCES: Record<string, string[]> = {
  user: ["public", "authenticated", "user"],
  admin: ["public", "authenticated", "admin"],
};

const USER: SessionUser = { id: "user-1", email: "u1@example.com" };
const ADMIN: SessionAdmin = {
  id: "admin-1",
  email: "a1@example.com",
  rules: { role: "owner", permissions: [] },
};

function config(overrides: Partial<Row> = {}): Row {
  return {
    remote_config_id: 1,
    key: KEY,
    value: { enabled: true },
    audience: "public",
    description: null,
    is_active: true,
    hash: HASH,
    created_at: 1_000,
    updated_at: 2_000,
    ...overrides,
  };
}

function harness(rows: Row[], statistics: Row[] = []) {
  const rest = installRestMock({ [TABLE]: rows, [STATS_TABLE]: statistics });
  rest.onRpc(RPC, (args) => {
    const caller = args?.p_caller_type as string | null;
    return caller ? AUDIENCES[caller] ?? ["public"] : ["public"];
  });

  const rate = installRateLimiterMock();

  const recorded: RecordRemoteConfigStatisticInput[] = [];
  const queue = installMock(
    remoteConfigStatisticsQueue,
    "pushMany",
    ((items: readonly RecordRemoteConfigStatisticInput[]) => {
      recorded.push(...items);
      return Promise.resolve(items.map((_, index) => `job-${index}`));
    }) as typeof remoteConfigStatisticsQueue.pushMany,
  );

  return {
    rows: (table: string): Row[] => rest.rows(table),
    recorded: (): RecordRemoteConfigStatisticInput[] => recorded,
    restore(): void {
      queue.restore();
      rate.restore();
      rest.restore();
    },
  };
}

function get(path: string, identity?: SessionUser | SessionAdmin) {
  return { method: "GET", path, ...(identity ? { identity } : {}) };
}

Deno.test("GET /features/devops/remote-config/:key serves the value and the hash the client will store", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`),
    );

    assertEquals(res.status, 200);
    const data = res.body.data as Record<string, unknown>;
    assertEquals(data.key, KEY);
    assertEquals(data.value, { enabled: true });
    assertEquals(data.hash, HASH);
  } finally {
    rest.restore();
  }
});

Deno.test("a known hash gets `unchanged` and no value at all", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}?hash=${HASH}`),
    );

    assertEquals(res.status, 200);
    assertEquals(res.body.code, APP_REMOTE_CONFIG_CODES.unchanged);

    const data = res.body.data as Record<string, unknown>;
    assertEquals(data.hash, HASH);
    assertEquals(
      data.value,
      undefined,
      "resending the value would defeat the whole point of the hash",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("a stale hash gets the full config back", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}?hash=an-old-one`),
    );

    assertEquals(res.status, 200);
    assertEquals(res.body.code, "success");
    assertEquals((res.body.data as Record<string, unknown>).value, {
      enabled: true,
    });
  } finally {
    rest.restore();
  }
});

Deno.test("a disabled config answers 409 with a code the app can branch on", async () => {
  const rest = harness([config({ is_active: false })]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`),
    );

    assertEquals(res.status, 409);
    assertEquals(res.body.code, APP_REMOTE_CONFIG_CODES.inactive);
  } finally {
    rest.restore();
  }
});

Deno.test("a disabled config stays disabled even when the client sends the matching hash", async () => {
  const rest = harness([config({ is_active: false })]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}?hash=${HASH}`),
    );

    assertEquals(
      res.status,
      409,
      "answering `unchanged` would leave the app running on a config that was turned off",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("an unknown key is a 404", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle("nope"),
      {},
      get("/features/devops/remote-config/nope"),
    );

    assertEquals(res.status, 404);
  } finally {
    rest.restore();
  }
});

Deno.test("a malformed key is refused before it ever reaches the database", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle("../etc/passwd"),
      {},
      get("/features/devops/remote-config/x"),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_key");
  } finally {
    rest.restore();
  }
});

Deno.test("an admin-audience config never reaches the app, session or not", async () => {
  const rest = harness([config({ audience: "admin" })]);

  try {
    const anonymous = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`),
    );
    const signedIn = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`, USER),
    );

    assertEquals(anonymous.status, 404);
    assertEquals(signedIn.status, 404);
  } finally {
    rest.restore();
  }
});

Deno.test("a user-audience config needs a session on the app surface", async () => {
  const rest = harness([config({ audience: "user" })]);

  try {
    const anonymous = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`),
    );
    const signedIn = await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`, USER),
    );

    assertEquals(anonymous.status, 404);
    assertEquals(signedIn.status, 200);
  } finally {
    rest.restore();
  }
});

Deno.test("the admin surface refuses an anonymous caller", async () => {
  const rest = harness([config()]);

  try {
    const list = await callEndpoint(
      () => AdminRemoteConfigListEndpoint.handle(),
      {},
      get("/features/devops/remote-config/config"),
    );
    const remove = await callEndpoint(
      () => AdminRemoteConfigDeleteEndpoint.handle(KEY),
      {},
      { method: "DELETE", path: `/features/devops/remote-config/config/${KEY}` },
    );

    assertEquals(list.status, 401);
    assertEquals(remove.status, 401);
  } finally {
    rest.restore();
  }
});

// --- admin: the management view sees everything ----------------------------

Deno.test("the admin list carries every config, whatever its audience or state", async () => {
  const rest = harness([
    config({ remote_config_id: 1, key: "pub", audience: "public" }),
    config({ remote_config_id: 2, key: "usr", audience: "user" }),
    config({ remote_config_id: 3, key: "off", audience: "public", is_active: false }),
  ]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigListEndpoint.handle(),
      {},
      get("/features/devops/remote-config/config", ADMIN),
    );

    assertEquals(res.status, 200);
    const data = res.body.data as {
      configs: { key: string }[];
      pagination: Record<string, unknown>;
    };
    assertEquals(data.configs.map((item) => item.key).sort(), ["off", "pub", "usr"]);
    assertEquals(data.pagination.has_more, false);
  } finally {
    rest.restore();
  }
});

Deno.test("the admin list paginates", async () => {
  const rows = Array.from(
    { length: 5 },
    (_, i) => config({ remote_config_id: i + 1, key: `k${i}`, audience: "public" }),
  );
  const rest = harness(rows);

  try {
    const page = await callEndpoint(
      () => AdminRemoteConfigListEndpoint.handle(),
      {},
      get("/features/devops/remote-config/config?offset=0&size=2", ADMIN),
    );

    const paged = page.body.data as {
      configs: unknown[];
      pagination: Record<string, unknown>;
    };
    assertEquals(paged.configs.length, 2);
    assertEquals(paged.pagination.has_more, true);
  } finally {
    rest.restore();
  }
});

Deno.test("the admin read serves a disabled config so it can be switched back on", async () => {
  const rest = harness([config({ is_active: false })]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/config/${KEY}`, ADMIN),
    );

    assertEquals(res.status, 200);
    assertEquals((res.body.data as Record<string, unknown>).is_active, false);
  } finally {
    rest.restore();
  }
});

Deno.test("the admin read serves a config whose audience it could never consume", async () => {
  const rest = harness([config({ audience: "user" })]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/config/${KEY}`, ADMIN),
    );

    assertEquals(
      res.status,
      200,
      "filtering here would make a user-audience config uneditable",
    );
  } finally {
    rest.restore();
  }
});

// --- admin: writing ---------------------------------------------------------

Deno.test("POST /features/devops/remote-config/config creates the row", async () => {
  const rest = harness([]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigCreateEndpoint.handle(),
      { key: "new.key", value: { a: 1 }, audience: "user" },
      { method: "POST", path: "/features/devops/remote-config/config", identity: ADMIN },
    );

    assertEquals(res.status, 201);
    assertEquals(rest.rows(TABLE).length, 1);
    assertEquals(rest.rows(TABLE)[0].key, "new.key");
    assertEquals(rest.rows(TABLE)[0].audience, "user");
  } finally {
    rest.restore();
  }
});

Deno.test("POST refuses a non-object value and an unknown audience", async () => {
  const rest = harness([]);

  try {
    const badValue = await callEndpoint(
      () => AdminRemoteConfigCreateEndpoint.handle(),
      { key: "k", value: "not-an-object" },
      { method: "POST", path: "/features/devops/remote-config/config", identity: ADMIN },
    );
    const badAudience = await callEndpoint(
      () => AdminRemoteConfigCreateEndpoint.handle(),
      { key: "k", value: {}, audience: "everyone" },
      { method: "POST", path: "/features/devops/remote-config/config", identity: ADMIN },
    );

    assertEquals(badValue.status, 400);
    assertEquals(badValue.body.code, "invalid_value");
    assertEquals(badAudience.status, 400);
    assertEquals(badAudience.body.code, "invalid_audience");
    assertEquals(rest.rows(TABLE).length, 0);
  } finally {
    rest.restore();
  }
});

Deno.test("PATCH /features/devops/remote-config/config/:key applies only the fields it was given", async () => {
  const rest = harness([config({ description: "before" })]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigUpdateEndpoint.handle(KEY),
      { is_active: false },
      { method: "PATCH", path: `/features/devops/remote-config/config/${KEY}`, identity: ADMIN },
    );

    assertEquals(res.status, 200);
    const row = rest.rows(TABLE)[0];
    assertEquals(row.is_active, false);
    assertEquals(row.description, "before", "an absent field must not be wiped");
    assertEquals(row.value, { enabled: true });
  } finally {
    rest.restore();
  }
});

Deno.test("PATCH refuses an empty patch rather than pretending it worked", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigUpdateEndpoint.handle(KEY),
      {},
      { method: "PATCH", path: `/features/devops/remote-config/config/${KEY}`, identity: ADMIN },
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "empty_patch");
  } finally {
    rest.restore();
  }
});

Deno.test("PATCH and DELETE answer 404 on an unknown key", async () => {
  const rest = harness([config()]);

  try {
    const patched = await callEndpoint(
      () => AdminRemoteConfigUpdateEndpoint.handle("nope"),
      { is_active: false },
      { method: "PATCH", path: "/features/devops/remote-config/config/nope", identity: ADMIN },
    );
    const removed = await callEndpoint(
      () => AdminRemoteConfigDeleteEndpoint.handle("nope"),
      {},
      { method: "DELETE", path: "/features/devops/remote-config/config/nope", identity: ADMIN },
    );

    assertEquals(patched.status, 404);
    assertEquals(removed.status, 404);
    assertEquals(rest.rows(TABLE).length, 1);
  } finally {
    rest.restore();
  }
});

Deno.test("DELETE /features/devops/remote-config/config/:key removes the row", async () => {
  const rest = harness([config()]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigDeleteEndpoint.handle(KEY),
      {},
      { method: "DELETE", path: `/features/devops/remote-config/config/${KEY}`, identity: ADMIN },
    );

    assertEquals(res.status, 200);
    assertEquals(rest.rows(TABLE).length, 0);
  } finally {
    rest.restore();
  }
});

// --- read statistics --------------------------------------------------------

Deno.test("reading a key records one enqueued row, never an inline write", async () => {
  const rest = harness([config()]);

  try {
    await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`, USER),
    );

    assertEquals(rest.recorded(), [{
      remoteConfigId: 1,
      audience: RemoteConfigAudience.PUBLIC,
      outcome: RemoteConfigOutcome.Served,
      userId: USER.id,
    }]);
    assertEquals(
      rest.rows("internal_t__remote_config_statistics").length,
      0,
      "the read path must not write to the database itself",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("an `unchanged` answer is still counted, under its own outcome", async () => {
  const rest = harness([config()]);

  try {
    await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}?hash=${HASH}`),
    );

    const [entry] = rest.recorded();
    assertEquals(entry.outcome, RemoteConfigOutcome.Unchanged);
    assertEquals(entry.userId, undefined, "an anonymous read carries no user id");
  } finally {
    rest.restore();
  }
});

Deno.test("the audience actually read is snapshotted, not inferred later", async () => {
  const rest = harness([config({ audience: "authenticated" })]);

  try {
    await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`, USER),
    );

    assertEquals(rest.recorded()[0].audience, RemoteConfigAudience.AUTHENTICATED);
  } finally {
    rest.restore();
  }
});

Deno.test("a refused read is never counted", async () => {
  const rest = harness([config({ audience: "admin" })]);

  try {
    await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/${KEY}`, USER),
    );
    await callEndpoint(
      () => AppRemoteConfigReadEndpoint.handle("nope"),
      {},
      get("/features/devops/remote-config/nope", USER),
    );

    assertEquals(rest.recorded(), []);
  } finally {
    rest.restore();
  }
});

Deno.test("the admin surface records nothing at all", async () => {
  const rest = harness([config()]);

  try {
    await callEndpoint(
      () => AdminRemoteConfigListEndpoint.handle(),
      {},
      get("/features/devops/remote-config/config", ADMIN),
    );
    await callEndpoint(
      () => AdminRemoteConfigReadEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/config/${KEY}`, ADMIN),
    );

    assertEquals(
      rest.recorded(),
      [],
      "the table lost admin_id: these statistics are about app usage only",
    );
  } finally {
    rest.restore();
  }
});

// --- admin: the statistics --------------------------------------------------

function statistic(overrides: Partial<Row> = {}): Row {
  return {
    statistic_id: 10,
    remote_config_id: 1,
    user_id: "user-1",
    audience: "public",
    outcome: RemoteConfigOutcome.Served,
    created_at: 5_000,
    ...overrides,
  };
}

Deno.test("the statistics list is scoped by config key, not by numeric id", async () => {
  const rest = harness(
    [config({ remote_config_id: 1, key: KEY }), config({ remote_config_id: 2, key: "other" })],
    [
      statistic({ statistic_id: 10, remote_config_id: 1 }),
      statistic({ statistic_id: 11, remote_config_id: 2 }),
      statistic({ statistic_id: 12, remote_config_id: 1 }),
    ],
  );

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigStatisticsListEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/statistics/config/${KEY}`, ADMIN),
    );

    assertEquals(res.status, 200);
    const ids = (res.body.data as { statistics: { id: number }[] }).statistics.map((s) => s.id).sort();
    assertEquals(ids, [10, 12], "only the statistics of the config addressed by its key");
  } finally {
    rest.restore();
  }
});

Deno.test("the statistics list answers not-found on an unknown key", async () => {
  const rest = harness([config()], [statistic()]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigStatisticsListEndpoint.handle("nope"),
      {},
      get("/features/devops/remote-config/statistics/config/nope", ADMIN),
    );

    assertEquals(res.status, 404);
  } finally {
    rest.restore();
  }
});

Deno.test("the statistics list refuses a malformed key before touching the database", async () => {
  const rest = harness([config()], [statistic()]);

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigStatisticsListEndpoint.handle("bad key!"),
      {},
      get("/features/devops/remote-config/statistics/config/bad%20key!", ADMIN),
    );

    assertEquals(res.status, 400);
    assertEquals((res.body as { code?: string }).code ?? (res.body.error as { code?: string })?.code, "invalid_key");
  } finally {
    rest.restore();
  }
});

Deno.test("reading one statistic carries the outcome and the audience actually served", async () => {
  const rest = harness(
    [config()],
    [statistic({
      statistic_id: 10,
      audience: RemoteConfigAudience.AUTHENTICATED,
      outcome: RemoteConfigOutcome.Unchanged,
    })],
  );

  try {
    const res = await callEndpoint(
      () => AdminRemoteConfigStatisticsReadEndpoint.handle("10"),
      {},
      get("/features/devops/remote-config/statistics/10", ADMIN),
    );

    assertEquals(res.status, 200);
    const body = res.body.data as { id: number; audience: string; outcome: string; user_id: string | null };
    assertEquals(body.id, 10);
    assertEquals(body.audience, RemoteConfigAudience.AUTHENTICATED);
    assertEquals(body.outcome, RemoteConfigOutcome.Unchanged);
    assertEquals(body.user_id, "user-1");
  } finally {
    rest.restore();
  }
});

Deno.test("reading an unknown statistic is a 404, a malformed id a 400", async () => {
  const rest = harness([config()], [statistic({ statistic_id: 10 })]);

  try {
    const missing = await callEndpoint(
      () => AdminRemoteConfigStatisticsReadEndpoint.handle("999"),
      {},
      get("/features/devops/remote-config/statistics/999", ADMIN),
    );
    const malformed = await callEndpoint(
      () => AdminRemoteConfigStatisticsReadEndpoint.handle("abc"),
      {},
      get("/features/devops/remote-config/statistics/abc", ADMIN),
    );

    assertEquals(missing.status, 404);
    assertEquals(malformed.status, 400);
  } finally {
    rest.restore();
  }
});

Deno.test("the statistics endpoints refuse an anonymous caller", async () => {
  const rest = harness([config()], [statistic()]);

  try {
    const list = await callEndpoint(
      () => AdminRemoteConfigStatisticsListEndpoint.handle(KEY),
      {},
      get(`/features/devops/remote-config/statistics/config/${KEY}`),
    );
    const read = await callEndpoint(
      () => AdminRemoteConfigStatisticsReadEndpoint.handle("10"),
      {},
      get("/features/devops/remote-config/statistics/10"),
    );

    assertEquals(list.status, 401);
    assertEquals(read.status, 401);
  } finally {
    rest.restore();
  }
});
