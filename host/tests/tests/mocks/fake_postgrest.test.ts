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

import { assertEquals } from "@std/assert";
import { FakePostgrestClient } from "@scribe/foundation/testing/database.ts";

Deno.test("FakePostgrestClient: neq/gt/gte/lt/lte filters", async () => {
  const db = new FakePostgrestClient({
    widgets: [
      { id: "1", position: 1 },
      { id: "2", position: 2 },
      { id: "3", position: 3 },
    ],
  });
  const ids = async (builder: PromiseLike<{ data: unknown }>) =>
    ((await builder).data as { id: string }[]).map((r) => r.id).sort();

  assertEquals(await ids(db.from("widgets").select("id").neq("id", "2")), [
    "1",
    "3",
  ]);
  assertEquals(await ids(db.from("widgets").select("id").gt("position", 1)), [
    "2",
    "3",
  ]);
  assertEquals(await ids(db.from("widgets").select("id").gte("position", 2)), [
    "2",
    "3",
  ]);
  assertEquals(await ids(db.from("widgets").select("id").lt("position", 2)), [
    "1",
  ]);
  assertEquals(await ids(db.from("widgets").select("id").lte("position", 2)), [
    "1",
    "2",
  ]);
});

Deno.test("FakePostgrestClient: is/in filters", async () => {
  const db = new FakePostgrestClient({
    widgets: [
      { id: "1", archived_at: null },
      { id: "2", archived_at: "2024" },
      { id: "3", archived_at: null },
    ],
  });

  const { data: nulls } = await db
    .from("widgets")
    .select("id")
    .is("archived_at", null);
  assertEquals((nulls as { id: string }[]).map((r) => r.id).sort(), ["1", "3"]);

  const { data: inSet } = await db
    .from("widgets")
    .select("id")
    .in("id", ["1", "3", "unknown"]);
  assertEquals((inSet as { id: string }[]).map((r) => r.id).sort(), ["1", "3"]);
});

Deno.test(
  "FakePostgrestClient: like is case-sensitive, ilike is not, % and _ act as SQL wildcards",
  async () => {
    const db = new FakePostgrestClient({
      widgets: [
        { id: "1", name: "Acme" },
        { id: "2", name: "acme" },
        { id: "3", name: "Beta" },
      ],
    });

    const { data: exact } = await db
      .from("widgets")
      .select("id")
      .like("name", "Acme");
    assertEquals(
      (exact as { id: string }[]).map((r) => r.id),
      ["1"],
    );

    const { data: insensitive } = await db
      .from("widgets")
      .select("id")
      .ilike("name", "acme");
    assertEquals((insensitive as { id: string }[]).map((r) => r.id).sort(), [
      "1",
      "2",
    ]);

    const { data: prefix } = await db
      .from("widgets")
      .select("id")
      .like("name", "A%");
    assertEquals(
      (prefix as { id: string }[]).map((r) => r.id),
      ["1"],
    );
  },
);

Deno.test(
  "FakePostgrestClient: select(cols) projects only the requested columns",
  async () => {
    const db = new FakePostgrestClient({
      widgets: [{ id: "1", name: "Acme", secret: "x" }],
    });

    const { data } = await db.from("widgets").select("id, name").eq("id", "1");

    assertEquals(data, [{ id: "1", name: "Acme" }]);
  },
);

Deno.test(
  "FakePostgrestClient: maybeSingle returns the first match or null, never an array",
  async () => {
    const db = new FakePostgrestClient({ widgets: [{ id: "1" }] });

    const found = await db
      .from("widgets")
      .select("*")
      .eq("id", "1")
      .maybeSingle();
    assertEquals(found.data, { id: "1" });

    const missing = await db
      .from("widgets")
      .select("*")
      .eq("id", "999")
      .maybeSingle();
    assertEquals(missing.data, null);
  },
);

Deno.test(
  "FakePostgrestClient: order() with multiple columns sorts by the most significant one first",
  async () => {
    const db = new FakePostgrestClient({
      widgets: [
        { id: "a", group: 2, position: 1 },
        { id: "b", group: 1, position: 2 },
        { id: "c", group: 1, position: 1 },
      ],
    });

    const { data } = await db
      .from("widgets")
      .select("id")
      .order("group")
      .order("position");

    assertEquals(
      (data as { id: string }[]).map((r) => r.id),
      ["c", "b", "a"],
    );
  },
);

Deno.test(
  "FakePostgrestClient: seed() replaces a table's rows wholesale",
  () => {
    const db = new FakePostgrestClient({ widgets: [{ id: "1" }] });

    db.seed("widgets", [{ id: "2" }]);

    assertEquals(db.rows("widgets"), [{ id: "2" }]);
  },
);

Deno.test(
  "FakePostgrestClient: rpc() calls the registered handler with its args and returns its result as data",
  async () => {
    const db = new FakePostgrestClient();
    db.onRpc("get_sync_ids", (args) => ({ upserted_ids: [args?.cursor] }));

    const { data, error } = await db.rpc("get_sync_ids", { cursor: "42" });

    assertEquals(data, { upserted_ids: ["42"] });
    assertEquals(error, null);
  },
);

Deno.test(
  "FakePostgrestClient: rpc() with no registered handler resolves to null data instead of throwing",
  async () => {
    const db = new FakePostgrestClient();

    const { data, error } = await db.rpc("unregistered_fn");

    assertEquals(data, null);
    assertEquals(error, null);
  },
);
