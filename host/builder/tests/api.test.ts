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
import { join } from "@std/path";
import { ApiError, type ProjectApi, scanApi } from "../src/client/project/api.ts";
import { inTemporaryRoot } from "./support/workspace.ts";
import { writeProject, writeSources } from "./support/project.ts";

async function apiOf(root: string, tree: Readonly<Record<string, string>>): Promise<ProjectApi> {
  const directory = await writeProject(root, "my_api");
  await writeSources(directory, tree);
  return scanApi(directory);
}

async function refusalOf(
  root: string,
  tree: Readonly<Record<string, string>>,
  says: string,
  message: string,
): Promise<void> {
  const directory = await writeProject(root, "my_api");
  await writeSources(directory, tree);
  await assertRejects(() => scanApi(directory), ApiError, says, message);
}

Deno.test("a file under a node answers the path it is named after", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/brand.ts": "" });
    assertEquals(api.routes.map((route) => [route.node, route.path]), [["app", "/brand"]]);
    assertEquals(api.routes[0].file, "lib/src/app/brand.ts", "the file was not written relative to the project");
  });
});

Deno.test("a file named index answers the path of the directory holding it", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/brand/index.ts": "" });
    assertEquals(api.routes.map((route) => route.path), ["/brand"], "index took a path of its own");
  });
});

Deno.test("a file in brackets becomes a parameter", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "admin/item/[id].ts": "" });
    assertEquals(api.routes.map((route) => route.path), ["/item/:id"], "the brackets were not read");
  });
});

Deno.test("a directory in brackets becomes a parameter too", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "admin/items/[group]/count.ts": "" });
    assertEquals(api.routes.map((route) => route.path), ["/items/:group/count"], "a parameter directory was missed");
  });
});

Deno.test("every directory of lib/src is a node, sorted, one with no route included", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/_middleware.ts": "", "admin/item/[id].ts": "", "webhook/stripe.ts": "" });
    assertEquals(api.nodes, ["admin", "app", "webhook"], "the nodes came back in another order");
    assertEquals(api.routes.map((route) => route.node), ["admin", "webhook"], "an empty node produced a route");
  });
});

Deno.test("a file starting with an underscore answers no path", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/brand.ts": "", "app/_guards.ts": "" });
    assertEquals(api.routes.map((route) => route.file), ["lib/src/app/brand.ts"], "a reserved file was served");
  });
});

Deno.test("a route runs every middleware between its node and itself, outermost first", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, {
      "app/_middleware.ts": "",
      "app/brand/_middleware.ts": "",
      "app/brand/[brandId].ts": "",
    });
    assertEquals(api.routes[0].branches, [
      "lib/src/app/_middleware.ts",
      "lib/src/app/brand/_middleware.ts",
    ], "the branches are not in the order the layers merge in");
  });
});

Deno.test("a middleware does not reach the branch beside it", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/brand/_middleware.ts": "", "app/store.ts": "" });
    const store = api.routes.find((route) => route.path === "/store");
    assertEquals(store?.branches, [], "a middleware leaked out of its own subtree");
  });
});

Deno.test("index is the one name a sibling directory may repeat", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/index.ts": "", "app/index/detail.ts": "" });
    assertEquals(api.routes.map((route) => route.path).sort(), ["/", "/index/detail"], "index refused its neighbour");
  });
});

Deno.test("a file and a directory claiming one path are refused", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(
      root,
      { "app/brand.ts": "", "app/brand/detail.ts": "" },
      "both claim /brand",
      "a file and a directory of the same name went through",
    );
  });
});

Deno.test("the sink at the root of lib takes what no node claimed", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api", { files: { "lib/_logs.ts": "" } });
    await writeSources(directory, { "app/brand.ts": "" });
    const api = await scanApi(directory);
    assertEquals(api.sinks, [{ node: null, file: "lib/_logs.ts" }], "the root sink was not found");
  });
});

Deno.test("a node's own sink names that node", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "admin/_logs.ts": "", "admin/item/[id].ts": "" });
    assertEquals(api.sinks, [{ node: "admin", file: "lib/src/admin/_logs.ts" }], "the node's sink was not found");
  });
});

Deno.test("the root sink comes first, then one per node in the order the nodes come", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api", { files: { "lib/_logs.ts": "" } });
    await writeSources(directory, { "app/_logs.ts": "", "admin/_logs.ts": "" });
    const api = await scanApi(directory);
    assertEquals(api.sinks.map((sink) => sink.node), [null, "admin", "app"], "the sinks came back in another order");
  });
});

Deno.test("a node that declares no sink gets none, and nothing falls back to the root", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api", { files: { "lib/_logs.ts": "" } });
    await writeSources(directory, { "app/brand.ts": "", "admin/_logs.ts": "" });
    const api = await scanApi(directory);
    assertEquals(api.sinks.map((sink) => sink.node), [null, "admin"], "app was given a sink it never declared");
  });
});

Deno.test("a sink below the root of its node is refused", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(
      root,
      { "app/brand/_logs.ts": "", "app/brand/index.ts": "" },
      "would be handed nothing",
      "a sink the host could never reach went through",
    );
  });
});

Deno.test("the name a sink used to go by is refused rather than ignored", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(root, { "app/_log.ts": "" }, "is obsolete", "_log.ts was passed over in silence");
  });
});

Deno.test("the file a node used to declare itself in is refused", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(root, { "app/_node.ts": "" }, "is obsolete", "_node.ts was passed over in silence");
  });
});

Deno.test("a routable file above every node is refused", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(root, { "brand.ts": "" }, "answers for no node", "a file with no node went through");
  });
});

Deno.test("a middleware above every node is refused", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(root, { "_middleware.ts": "" }, "wraps nothing", "a middleware belonging to no node went through");
  });
});

Deno.test("a sink at the root of lib/src is refused, since the one that takes the rest sits in lib", async () => {
  await inTemporaryRoot(async (root) => {
    await refusalOf(root, { "_logs.ts": "" }, "takes the entries of no node", "a misplaced sink went through");
  });
});

Deno.test("a project with no lib/src is refused", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api");
    await assertRejects(() => scanApi(directory), ApiError, "has no lib/src/", "a project with no tree went through");
  });
});

Deno.test("a reserved directory is not a node and is never walked into", async () => {
  await inTemporaryRoot(async (root) => {
    const api = await apiOf(root, { "app/brand.ts": "", "_shared/helper.ts": "", "app/_parts/piece.ts": "" });
    assertEquals(api.nodes, ["app"], "a reserved directory became a node");
    assertEquals(api.routes.map((route) => route.file), ["lib/src/app/brand.ts"], "a reserved directory was walked");
  });
});

Deno.test("a file that is not TypeScript answers no path", async () => {
  await inTemporaryRoot(async (root) => {
    const directory = await writeProject(root, "my_api");
    await writeSources(directory, { "app/brand.ts": "" });
    await Deno.writeTextFile(join(directory, "lib", "src", "app", "notes.md"), "");
    const api = await scanApi(directory);
    assertEquals(api.routes.map((route) => route.file), ["lib/src/app/brand.ts"], "a non-source file was served");
  });
});
