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
  defineSearcher,
  type EntitySearchParams,
  Field,
  searcherRegistry,
  SortOrder,
} from "@scribe/host/dependencies/features/searcher/mod.ts";
import { assertEquals, assertThrows } from "@std/assert";

interface WidgetPreview {
  widget_id: string;
  name: string;
}

interface WidgetSearch extends EntitySearchParams {
  text?: string;
  sort?: "name";
}

const widget = defineSearcher({
  name: "widget",
  table: "widgets",
  id: "widget_id",
  properties: {
    widget_id: Field.keyword(),
    name: Field.text({ sortable: true }),
  },
  sorts: (f) => ({ name: f.keyword("name", SortOrder.Asc) }),
  query: (params: WidgetSearch, { q, f, sorts }) => q.text(params.text, [f.boost("name", 2)]).sort(sorts.name),
  document: (ids: string[]): Promise<Record<string, unknown>[]> =>
    Promise.resolve(ids.map((id) => ({ widget_id: id, name: `w-${id}` }))),
  fetch: (_ids: string[]): Promise<WidgetPreview[]> => Promise.resolve([]),
});

Deno.test("defineSearcher() only exposes add/delete/search to lib/", () => {
  for (const verb of ["add", "delete", "search"]) {
    assertEquals(
      typeof (widget as unknown as Record<string, unknown>)[verb],
      "function",
    );
  }
});

Deno.test("defineSearcher() registers the full entity for the kernel", () => {
  const entity = searcherRegistry.byName("widget");
  assertEquals(entity?.table, "widgets");
  assertEquals(entity?.id, "widget_id");
  assertEquals(entity?.defaultPageSize, 20);
  assertEquals(searcherRegistry.byTable("widgets"), entity);
});

Deno.test("the registry returns null for an unknown entity", () => {
  assertEquals(searcherRegistry.byTable("inconnue"), null);
  assertEquals(searcherRegistry.byName("inconnue"), null);
});

Deno.test("the kernel reaches documents/applyIndex/applyRemove through the registry", async () => {
  const entity = searcherRegistry.byName("widget")!;
  assertEquals(typeof entity.applyIndex, "function");
  assertEquals(typeof entity.applyRemove, "function");
  assertEquals(await entity.documents(["a", "b"]), [
    { widget_id: "a", name: "w-a" },
    { widget_id: "b", name: "w-b" },
  ]);
});

Deno.test("defineSearcher() refuses two entities with the same name", () => {
  assertThrows(
    () =>
      defineSearcher({
        name: "widget",
        table: "autre_table",
        id: "widget_id",
        properties: { widget_id: Field.keyword() },
        query: (_params: WidgetSearch, { q }) => q,
        document: (_ids: string[]): Promise<Record<string, unknown>[]> => Promise.resolve([]),
        fetch: (_ids: string[]): Promise<WidgetPreview[]> => Promise.resolve([]),
      }),
    Error,
    'entity "widget" already declared',
  );
});

Deno.test("defineSearcher() refuses two entities on the same table", () => {
  assertThrows(
    () =>
      defineSearcher({
        name: "autre",
        table: "widgets",
        id: "widget_id",
        properties: { widget_id: Field.keyword() },
        query: (_params: WidgetSearch, { q }) => q,
        document: (_ids: string[]): Promise<Record<string, unknown>[]> => Promise.resolve([]),
        fetch: (_ids: string[]): Promise<WidgetPreview[]> => Promise.resolve([]),
      }),
    Error,
    'table "widgets" already indexed',
  );
});
