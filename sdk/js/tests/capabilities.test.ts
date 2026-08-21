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

import { assertEquals, assertRejects } from "@std/assert";
import { CallScope, CapabilityError, cache, host, rest, UnaryServer } from "../mod.ts";
import {
  FilterOperator,
  Operation,
  type Query,
  Database,
} from "../gen/scribe/host/pkg/packages/foundation/protocol/database/database_pb.ts";
import { Valkery } from "../gen/scribe/host/pkg/packages/foundation/protocol/valkery/valkery_pb.ts";
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
    .on(Database.method.execute, (query, call) => {
      capture.query = query;
      capture.token = call.capabilityToken;
      capture.trace = call.traceId;
      return { data: encodeJson(rows), count: 7n };
    })
    .on(Valkery.method.get, () => ({ hit: true, value: encodeJson({ cached: true }) }))
    .on(Valkery.method.set, () => ({
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
