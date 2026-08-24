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

import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { scanApi } from "../client/project/api.ts";
import { routesSource, writeRoutes } from "../client/project/routes.ts";
import { DERIVED_DIRECTORY, ROUTES_FILE } from "../client/project/layout.ts";
import { inTemporaryRoot } from "./support/workspace.ts";
import { writeProject, writeSources } from "./support/project.ts";

async function sourceOf(root: string, tree: Readonly<Record<string, string>>): Promise<string> {
  const directory = await writeProject(root, "my_api");
  await writeSources(directory, tree);
  const api = await scanApi(directory);
  return routesSource({ api, root: directory, at: join(directory, DERIVED_DIRECTORY, ROUTES_FILE) });
}

Deno.test("the table names the SDK the worker reading it runs on", async () => {
  await inTemporaryRoot(async (root) => {
    const source = await sourceOf(root, { "app/brand.ts": "" });
    assertStringIncludes(
      source,
      'import type { DiscoveredLogSink, DiscoveredRoute } from "@scribe/sdk";',
      "the table imports its types from somewhere else",
    );
  });
});

Deno.test("a route file is reached by a specifier relative to where the table sits", async () => {
  await inTemporaryRoot(async (root) => {
    const source = await sourceOf(root, { "app/brand.ts": "" });
    assertStringIncludes(source, 'import * as _r0 from "../lib/src/app/brand.ts";', "the specifier is not relative");
  });
});

Deno.test("a middleware two routes share is imported once", async () => {
  await inTemporaryRoot(async (root) => {
    const source = await sourceOf(root, { "app/_middleware.ts": "", "app/brand.ts": "", "app/store.ts": "" });
    const imports = source.split("\n").filter((line) => line.includes("_middleware.ts"));
    assertEquals(imports.length, 1, "the shared middleware was imported once per route");
  });
});

Deno.test("the sink that takes what no node claimed carries a null node", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api", { files: { "lib/_logs.ts": "" } });
    await writeSources(directory, { "app/brand.ts": "" });
    const api = await scanApi(directory);
    const source = routesSource({ api, root: directory, at: join(directory, DERIVED_DIRECTORY, ROUTES_FILE) });
    assertStringIncludes(source, 'node: null, file: "lib/_logs.ts"', "the root sink named a node");
  });
});

Deno.test("what the table says is what Deno reads back through it", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api", {
      files: { "lib/_logs.ts": "export const sink = 1;\n" },
    });
    await writeSources(directory, {
      "app/_middleware.ts": "export const layer = 1;\n",
      "app/brand/[brandId].ts": "export const read = 1;\n",
      "app/brand/index.ts": "export const list = 1;\n",
      "admin/_logs.ts": "export const sink = 1;\n",
      "admin/items/[group]/count.ts": "export const count = 1;\n",
    });
    const at = join(directory, DERIVED_DIRECTORY, ROUTES_FILE);
    await writeRoutes({ api: await scanApi(directory), root: directory, at });

    const table = await import(`file://${at}`) as {
      nodes: readonly string[];
      routes: readonly { node: string; path: string; module: Record<string, unknown> }[];
      logSinks: readonly { node: string | null }[];
    };

    assertEquals(table.nodes, ["admin", "app"], "the nodes did not survive the round trip");
    assertEquals(
      table.routes.map((route) => `${route.node}${route.path}`).sort(),
      ["admin/items/:group/count", "app/brand", "app/brand/:brandId"],
      "the paths did not survive the round trip",
    );
    assertEquals(table.logSinks.map((sink) => sink.node), [null, "admin"], "the sinks did not survive the round trip");
    assertEquals(table.routes[0].module.count, 1, "a route module did not load through its specifier");
  });
});
