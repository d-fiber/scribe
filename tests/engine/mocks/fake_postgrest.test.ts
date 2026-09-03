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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import { assertEquals } from "@std/assert";
import { FakePostgrestClient } from "@scribe/foundation/testing";

Scribe.test("FakePostgrestClient: neq/gt/gte/lt/lte filters", async () => {
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

Scribe.test("FakePostgrestClient: is/in filters", async () => {
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

Scribe.test(
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

Scribe.test(
  "FakePostgrestClient: select(cols) projects only the requested columns",
  async () => {
    const db = new FakePostgrestClient({
      widgets: [{ id: "1", name: "Acme", secret: "x" }],
    });

    const { data } = await db.from("widgets").select("id, name").eq("id", "1");

    assertEquals(data, [{ id: "1", name: "Acme" }]);
  },
);

Scribe.test(
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

Scribe.test(
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

Scribe.test(
  "FakePostgrestClient: seed() replaces a table's rows wholesale",
  () => {
    const db = new FakePostgrestClient({ widgets: [{ id: "1" }] });

    db.seed("widgets", [{ id: "2" }]);

    assertEquals(db.rows("widgets"), [{ id: "2" }]);
  },
);

Scribe.test(
  "FakePostgrestClient: rpc() calls the registered handler with its args and returns its result as data",
  async () => {
    const db = new FakePostgrestClient();
    db.onRpc("get_sync_ids", (args) => ({ upserted_ids: [args?.cursor] }));

    const { data, error } = await db.rpc("get_sync_ids", { cursor: "42" });

    assertEquals(data, { upserted_ids: ["42"] });
    assertEquals(error, null);
  },
);

Scribe.test(
  "FakePostgrestClient: rpc() with no registered handler resolves to null data instead of throwing",
  async () => {
    const db = new FakePostgrestClient();

    const { data, error } = await db.rpc("unregistered_fn");

    assertEquals(data, null);
    assertEquals(error, null);
  },
);
