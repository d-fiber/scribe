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
import { discover, DiscoveryError, loadDeclaration } from "../client/pkg/workspace/discovery.ts";
import { ManifestError } from "../client/pkg/declaration/manifest.ts";
import { MANIFEST_FILE } from "../client/pkg/workspace/layout.ts";
import { inTemporaryRoot, writePackage } from "./support/workspace.ts";

Deno.test("discovery finds a package by its manifest", async () => {
  await inTemporaryRoot(async (root) => {
    await writePackage(root, "realtime", { version: "1.2.0" });

    const found = await discover([root]);
    assertEquals(found.map((entry) => entry.declaration.name), ["realtime"], "the package was not found");
    assertEquals(found[0].declaration.version.toString(), "1.2.0", "the declaration was not read");
  });
});

Deno.test("discovery sorts what it finds by name", async () => {
  await inTemporaryRoot(async (root) => {
    await writePackage(root, "storage");
    await writePackage(root, "audiences");
    await writePackage(root, "realtime");

    const found = await discover([root]);
    assertEquals(
      found.map((entry) => entry.declaration.name),
      ["audiences", "realtime", "storage"],
      "the packages came back in another order",
    );
  });
});

Deno.test("discovery walks down to a package that is not at the top", async () => {
  await inTemporaryRoot(async (root) => {
    await writePackage(join(root, "security"), "auth");

    const found = await discover([root]);
    assertEquals(found.map((entry) => entry.declaration.name), ["auth"], "a package one level down was missed");
  });
});

Deno.test("discovery does not enter a package it has found", async () => {
  await inTemporaryRoot(async (root) => {
    const realtime = await writePackage(root, "realtime");
    await writePackage(join(realtime, "tests"), "audiences");

    const found = await discover([root]);
    assertEquals(found.map((entry) => entry.declaration.name), ["realtime"], "the walk went inside a package");
  });
});

Deno.test("discovery ignores a root that is not there", async () => {
  await inTemporaryRoot(async (root) => {
    const found = await discover([join(root, "packages")]);
    assertEquals(found, [], "a missing root produced something");
  });
});

Deno.test("a directory without a manifest is not a package", async () => {
  await inTemporaryRoot(async (root) => {
    await Deno.mkdir(join(root, "realtime"));
    await assertRejects(() => loadDeclaration(join(root, "realtime")), DiscoveryError, `carries no ${MANIFEST_FILE}`);
  });
});

Deno.test("a manifest that says nothing readable is refused", async () => {
  await inTemporaryRoot(async (root) => {
    await Deno.mkdir(join(root, "realtime"));
    await Deno.writeTextFile(join(root, "realtime", MANIFEST_FILE), "42\n");
    await assertRejects(() => loadDeclaration(join(root, "realtime")), ManifestError, "is not a mapping");
  });
});
