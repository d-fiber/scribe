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

import { assertEquals, assertRejects } from "@std/assert";
import { CallScope, CapabilityError, cache, host, rest, UnaryServer } from "../mod.ts";
import {
  FilterOperator,
  Operation,
  type Query,
  Rest,
} from "../gen/scribe/host/packages/foundation/database/rest/protocol/rest_pb.ts";
import { Cache } from "../gen/scribe/host/packages/foundation/cache/protocol/cache_pb.ts";
import { decodeJson, encodeJson } from "../src/contracts/json.ts";

interface Brand extends Record<string, unknown> {
  id: string;
  name: string;
  admin_id: string;
}

interface Capture {
  query: Query | null;
  token: string;
  trace: string;
}

async function withHost(
  capture: Capture,
  rows: unknown,
  run: () => Promise<void>,
): Promise<void> {
  const server = new UnaryServer()
    .on(Rest.method.execute, (query, call) => {
      capture.query = query;
      capture.token = call.capabilityToken;
      capture.trace = call.traceId;
      return { data: encodeJson(rows), count: 7n };
    })
    .on(Cache.method.get, () => ({ hit: true, value: encodeJson({ cached: true }) }))
    .on(Cache.method.set, () => ({
      error: { code: "cache_failed", message: "redis is down" },
    }));

  const listener = Deno.serve({ port: 0, onListen: () => {} }, (request) => server.handle(request));
  host.connect(`http://127.0.0.1:${(listener.addr as Deno.NetAddr).port}`);

  try {
    await run();
  } finally {
    host.disconnect();
    await listener.shutdown();
  }
}

Deno.test("a rest query travels as a description the host executes", async () => {
  const capture: Capture = { query: null, token: "", trace: "" };

  await withHost(capture, [{ id: "1", name: "Fiber", admin_id: "a" }], async () => {
    const rows = await CallScope.run(
      { capabilityToken: "token-42", traceId: "trace-42", invocationId: "inv", node: "" },
      () =>
        rest
          .from<Brand>("brands")
          .select("id", "name")
          .where((brand) => brand.name.ilike("fib%"))
          .order("name", { descending: true })
          .range(0, 19)
          .rows(),
    );

    assertEquals(rows.length, 1);
  });

  const query = capture.query;
  assertEquals(query?.table, "brands");
  assertEquals(query?.operation, Operation.SELECT);
  assertEquals(query?.select, ["id", "name"]);
  assertEquals(query?.where?.filters[0].column, "name");
  assertEquals(query?.where?.filters[0].operator, FilterOperator.ILIKE);
  assertEquals(decodeJson(query?.where?.filters[0].value), "fib%");
  assertEquals(query?.order[0].descending, true);
  assertEquals(query?.range?.offset, 0);
  assertEquals(query?.range?.limit, 20);
});

Deno.test("the capability token of the invocation is replayed on every outgoing call", async () => {
  const capture: Capture = { query: null, token: "", trace: "" };

  await withHost(capture, [], async () => {
    await CallScope.run(
      { capabilityToken: "token-42", traceId: "trace-42", invocationId: "inv", node: "" },
      () => rest.from<Brand>("brands").rows(),
    );
  });

  assertEquals(capture.token, "token-42");
  assertEquals(capture.trace, "trace-42");
});

Deno.test("a page reads the exact count the host answered", async () => {
  const capture: Capture = { query: null, token: "", trace: "" };

  await withHost(capture, [{ id: "1", name: "Fiber", admin_id: "a" }], async () => {
    const page = await rest.from<Brand>("brands").page();

    assertEquals(page.count, 7);
    assertEquals(page.rows.length, 1);
  });

  assertEquals(capture.query?.countExact, true);
});

Deno.test("a failing capability raises instead of returning a silent null", async () => {
  const capture: Capture = { query: null, token: "", trace: "" };

  await withHost(capture, [], async () => {
    assertEquals(await cache.get<{ cached: boolean }>("brands", "list"), { cached: true });

    const error = await assertRejects(
      () => cache.set("brands", "list", { cached: true }),
      CapabilityError,
    );
    assertEquals(error.code, "cache_failed");
  });
});

Deno.test("calling a capability before the handshake says so instead of hanging", async () => {
  host.disconnect();

  await assertRejects(() => rest.from<Brand>("brands").rows());
});
