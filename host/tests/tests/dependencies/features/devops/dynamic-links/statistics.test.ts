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
  DynamicLinkOutcome,
  DynamicLinkStatisticsError,
  type RecordStatisticInput,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { dynamicLinkStatisticsQueue } from "@scribe/host/dependencies/features/devops/dynamic-links/statistics/_queue.ts";
import { DynamicLinkStatisticsRepository } from "@scribe/host/dependencies/features/devops/dynamic-links/statistics/statistics.ts";
import { DeviceOs } from "@scribe/core/contracts/enums.ts";
import { queueRegistry } from "@scribe/host/packages/foundation/event_driven/queue/core/registry.ts";
import type { BatchHandler } from "@scribe/host/packages/foundation/event_driven/queue/contract.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { assert, assertEquals } from "@std/assert";

const QUEUE_NAME = "dynamic-link-statistics";
const TABLE = "internal_t__dynamic_link_statistics";

function hit(overrides: Partial<RecordStatisticInput> = {}): RecordStatisticInput {
  return {
    dynamicLinkId: 1,
    outcome: DynamicLinkOutcome.Served,
    ...overrides,
  };
}

function drain(): BatchHandler<RecordStatisticInput> {
  const registered = queueRegistry.get(QUEUE_NAME);
  assert(registered, `${QUEUE_NAME} must be registered by importing its module`);
  assertEquals(registered.mode, "batch");
  return registered.handler as BatchHandler<RecordStatisticInput>;
}

Deno.test("record enqueues the hit instead of writing it inline", async () => {
  const pushed: RecordStatisticInput[] = [];
  const queue = installMock(
    dynamicLinkStatisticsQueue,
    "push",
    ((data: RecordStatisticInput) => {
      pushed.push(data);
      return Promise.resolve("job-1");
    }) as typeof dynamicLinkStatisticsQueue.push,
  );
  const rest = installRestMock({ [TABLE]: [] });

  try {
    const input = hit({ platform: DeviceOs.IOS });
    const result = await new DynamicLinkStatisticsRepository().record(input);

    assert(result.ok);
    assertEquals(pushed, [input]);
    assertEquals(
      rest.rows(TABLE).length,
      0,
      "recording must not touch the database on the request path",
    );
  } finally {
    rest.restore();
    queue.restore();
  }
});

Deno.test("a queue that refuses the job surfaces as a backend failure", async () => {
  const queue = installMock(
    dynamicLinkStatisticsQueue,
    "push",
    (() => Promise.reject(new Error("nats down"))) as typeof dynamicLinkStatisticsQueue.push,
  );

  try {
    const result = await new DynamicLinkStatisticsRepository().record(hit());

    assert(!result.ok);
    assertEquals(result.error, DynamicLinkStatisticsError.Backend);
  } finally {
    queue.restore();
  }
});

Deno.test("the batch handler writes every hit in a single insert", async () => {
  const rest = installRestMock({ [TABLE]: [] });

  try {
    await drain()([
      hit({ dynamicLinkId: 1, outcome: DynamicLinkOutcome.Served, platform: DeviceOs.IOS }),
      hit({ dynamicLinkId: 1, outcome: DynamicLinkOutcome.OpenedApp, platform: DeviceOs.IOS }),
      hit({ dynamicLinkId: 2, outcome: DynamicLinkOutcome.Crawler }),
    ]);

    const rows = rest.rows(TABLE);
    assertEquals(rows.length, 3);
    assertEquals(rows.map((row: Row) => row.outcome), [
      DynamicLinkOutcome.Served,
      DynamicLinkOutcome.OpenedApp,
      DynamicLinkOutcome.Crawler,
    ]);
    assertEquals(rows.map((row: Row) => row.short_link_id), [1, 1, 2]);
  } finally {
    rest.restore();
  }
});

Deno.test("the batch handler maps the domain input onto the table columns", async () => {
  const rest = installRestMock({ [TABLE]: [] });

  try {
    await drain()([
      hit({
        dynamicLinkId: 7,
        outcome: DynamicLinkOutcome.StoreFallback,
        platform: DeviceOs.ANDROID,
        userId: "user-1",
        deviceId: "device-1",
        ipAddress: "203.0.113.7",
        userAgent: "Mozilla/5.0",
        referer: "https://brand.test",
      }),
    ]);

    assertEquals(rest.rows(TABLE)[0], {
      short_link_id: 7,
      outcome: DynamicLinkOutcome.StoreFallback,
      platform: DeviceOs.ANDROID,
      user_id: "user-1",
      device_id: "device-1",
      ip_address: "203.0.113.7",
      user_agent: "Mozilla/5.0",
      referer: "https://brand.test",
    });
  } finally {
    rest.restore();
  }
});

Deno.test("an anonymous hit writes explicit nulls, never undefined", async () => {
  const rest = installRestMock({ [TABLE]: [] });

  try {
    await drain()([hit()]);

    const row = rest.rows(TABLE)[0];
    for (const column of ["platform", "user_id", "device_id", "ip_address", "user_agent", "referer"]) {
      assertEquals(row[column], null, `${column} must be null, not undefined`);
    }
  } finally {
    rest.restore();
  }
});

Deno.test("an empty batch writes nothing at all", async () => {
  const rest = installRestMock({ [TABLE]: [] });

  try {
    await drain()([]);

    assertEquals(rest.rows(TABLE).length, 0);
  } finally {
    rest.restore();
  }
});
