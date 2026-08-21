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

import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { Constraint } from "../src/version/constraint.ts";
import { discover } from "../src/workspace/discovery.ts";
import { WorkspaceRegistry } from "../src/resolution/registry.ts";
import { resolve } from "../src/resolution/solver.ts";
import { emit } from "../src/emit/emit.ts";
import { importMapFor } from "../src/emit/import_map.ts";
import { lockText } from "../src/emit/lock.ts";
import { registrationsSource } from "../src/emit/registrations.ts";
import { resolutionDocument } from "../src/emit/resolution.ts";
import { inTemporaryRoot, writePackage } from "./support/workspace.ts";

async function chain(root: string): Promise<void> {
  await writePackage(root, "audiences", { files: { "lib/audiences.ts": "export const mounted = true;\n" } });
  await writePackage(root, "realtime", {
    version: "1.2.0",
    dependencies: { audiences: "^1.0.0" },
    files: {
      "lib/realtime.ts": 'import { mounted } from "@scribe/audiences";\nexport const hears = mounted;\n',
      "db/init/realtime.sql": "select 1;\n",
    },
  });
}

async function settled(root: string) {
  const packages = await discover([root]);
  return { packages, resolution: resolve(new Map([["realtime", Constraint.any()]]), new WorkspaceRegistry(packages)) };
}

Deno.test("the import map grants a package what it declared, inside its own scope", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"));

    assertEquals(
      map.scopes["../realtime/"],
      { "@scribe/audiences": "../audiences/lib/audiences.ts" },
      "realtime was granted something else",
    );
  });
});

Deno.test("the import map grants nothing from anywhere but the driver", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"), {
      driver: join(root, "builder", "mod.ts"),
    });

    assertEquals(map.imports, { "@scribe/builder": "../builder/mod.ts" }, "something else resolves from anywhere");
  });
});

Deno.test("a package that needs nothing gets no scope", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"));

    assertEquals("../audiences/" in map.scopes, false, "a package with no dependencies was granted a scope");
  });
});

Deno.test("a consumer reaches what it was told to and nothing behind it", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"), {
      consumers: [{ directory: join(root, "lib"), may: ["realtime"] }],
    });

    assertEquals(
      map.scopes["../lib/"],
      { "@scribe/realtime": "../realtime/lib/realtime.ts" },
      "the consumer reaches something other than realtime",
    );
  });
});

Deno.test("the import map carries nothing a package did not export", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"));

    assertEquals(
      Object.keys(map.scopes["../realtime/"]).some((specifier) => specifier.includes("src")),
      false,
      "the private half of a package is reachable through the map",
    );
  });
});

Deno.test("a package pulled in behind another lands in the resolution as transitive", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const { packages, resolution } = await settled(root);
    const document = resolutionDocument(resolution, packages, join(root, ".scribe", "resolution.json"));

    assertEquals(document.packages.map((entry) => entry.name), ["audiences", "realtime"], "the closure is not both");
    assertEquals(document.packages[0].direct, false, "audiences came back direct");
    assertEquals(document.packages[1].sql, "db/init", "the sql realtime provides was lost");
  });
});

Deno.test("the registrations mount a package after the one it needs", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const { packages, resolution } = await settled(root);
    const source = registrationsSource(resolution, packages, join(root, ".scribe", "registrations.ts"));

    assertEquals(
      source.indexOf('mount(Package.named("audiences")') < source.indexOf('mount(Package.named("realtime")'),
      true,
      `the order is not dependency first: ${source}`,
    );
  });
});

Deno.test("the registrations reach each package through its entry", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const { packages, resolution } = await settled(root);
    const source = registrationsSource(resolution, packages, join(root, ".scribe", "registrations.ts"));

    assertEquals(
      source.includes('import * as realtime from "../realtime/lib/realtime.ts";'),
      true,
      `the entry is not where the layout puts it: ${source}`,
    );
  });
});

Deno.test("the lock says which package the project asked for", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const { packages, resolution } = await settled(root);
    const written = lockText(resolution, packages);

    assertEquals(
      written.includes("  audiences:\n    version: 1.0.0\n    dependency: transitive"),
      true,
      `audiences is not locked as transitive: ${written}`,
    );
    assertEquals(
      written.includes("  realtime:\n    version: 1.2.0\n    dependency: direct"),
      true,
      `realtime is not locked as direct: ${written}`,
    );
    assertEquals(
      written.includes('      audiences: "^1.0.0"'),
      true,
      `the constraint realtime wrote is not locked: ${written}`,
    );
  });
});

Deno.test("a consumer is granted what the workspace settled outside the framework", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"), {
      consumers: [{ directory: join(root, "app"), may: ["realtime"] }],
      imports: new Map([["@std/assert", "jsr:@std/assert@1"]]),
    });

    assertEquals(
      map.scopes["../app/"],
      {
        "@scribe/realtime": "../realtime/lib/realtime.ts",
        "@std/assert": "jsr:@std/assert@1",
      },
      "the project's own code cannot reach what the workspace settled for it",
    );
  });
});

Deno.test("what a package reaches outside the framework sits in its own scope", async () => {
  await inTemporaryRoot(async (root) => {
    await writePackage(root, "audiences", {
      files: { "lib/audiences.ts": 'import "ioredis";\nexport const mounted = true;\n' },
    });
    await writePackage(root, "realtime", { files: { "lib/realtime.ts": "export const hears = true;\n" } });
    const map = importMapFor(await discover([root]), join(root, ".scribe", "imports.json"), {
      imports: new Map([["ioredis", "npm:ioredis@5"]]),
    });

    assertEquals(
      map.scopes["../audiences/"],
      { ioredis: "npm:ioredis@5" },
      "what the package declared outside the framework is not in its scope",
    );
    assertEquals("ioredis" in (map.scopes["../realtime/"] ?? {}), false, "a neighbour was granted it too");
  });
});

Deno.test("an emission writes the four files the toolchain reads", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const into = join(root, ".scribe");
    const resolution = await emit({
      roots: [root],
      into,
      wants: new Map([["realtime", Constraint.any()]]),
      consumers: [join(root, "app")],
    });

    assertEquals(
      resolution.packages.map((entry) => entry.name),
      ["audiences", "realtime"],
      "the emission settled on something other than the closure",
    );
    for (const file of ["imports.json", "resolution.json", "registrations.ts", "scribe.lock"]) {
      assertEquals((await Deno.stat(join(into, file))).isFile, true, `${file} was not written`);
    }
  });
});

Deno.test("an emission with nothing named wants every package it found", async () => {
  await inTemporaryRoot(async (root) => {
    await chain(root);
    const resolution = await emit({ roots: [root], into: join(root, ".scribe") });

    assertEquals(
      resolution.packages.filter((entry) => entry.direct).map((entry) => entry.name),
      ["audiences", "realtime"],
      "a package found under the roots was not wanted",
    );
  });
});
