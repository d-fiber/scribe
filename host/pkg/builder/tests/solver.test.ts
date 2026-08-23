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

import { assertEquals, assertThrows } from "@std/assert";
import type { Registry } from "../src/resolution/registry.ts";
import { ResolutionError, resolve } from "../src/resolution/solver.ts";
import { Constraint } from "@scribe/alchemy";
import { Version } from "@scribe/alchemy";

type Catalogue = Record<string, Record<string, Record<string, string>>>;

class Shelf implements Registry {
  readonly #catalogue: Catalogue;

  constructor(catalogue: Catalogue) {
    this.#catalogue = catalogue;
  }

  knows(name: string): boolean {
    return name in this.#catalogue;
  }

  versionsOf(name: string): readonly Version[] {
    return Object.keys(this.#catalogue[name] ?? {}).map(Version.parse);
  }

  dependenciesOf(
    name: string,
    version: Version,
  ): Readonly<Record<string, Constraint>> {
    const asked = this.#catalogue[name]?.[version.toString()] ?? {};
    return Object.fromEntries(
      Object.entries(asked).map(([dependency, constraint]) => [
        dependency,
        Constraint.parse(constraint),
      ]),
    );
  }
}

function wanted(entries: Record<string, string>): Map<string, Constraint> {
  return new Map(
    Object.entries(entries).map(([name, constraint]) => [
      name,
      Constraint.parse(constraint),
    ]),
  );
}

Deno.test("resolution pulls in what a package needs behind it", () => {
  const shelf = new Shelf({
    realtime: { "1.2.0": { audience: "^1.0.0" } },
    audience: { "1.0.0": {} },
  });

  const settled = resolve(wanted({ realtime: "^1.0.0" }), shelf);
  assertEquals(
    settled.packages.map((entry) => entry.name),
    ["audience", "realtime"],
    "the closure is not both packages",
  );
});

Deno.test("a package pulled in behind another is not direct", () => {
  const shelf = new Shelf({
    realtime: { "1.2.0": { audience: "^1.0.0" } },
    audience: { "1.0.0": {} },
  });

  const settled = resolve(wanted({ realtime: "^1.0.0" }), shelf);
  assertEquals(
    settled.packages.find((entry) => entry.name === "audience")?.direct,
    false,
    "audience came back direct",
  );
  assertEquals(
    settled.packages.find((entry) => entry.name === "realtime")?.direct,
    true,
    "realtime came back indirect",
  );
});

Deno.test("resolution takes the highest version a constraint allows", () => {
  const shelf = new Shelf({
    audience: { "1.0.0": {}, "1.4.0": {}, "2.0.0": {} },
  });

  const settled = resolve(wanted({ audience: "^1.0.0" }), shelf);
  assertEquals(
    settled.packages[0].version.toString(),
    "1.4.0",
    "the highest allowed version was not taken",
  );
});

Deno.test("two packages asking for the same one share a single version", () => {
  const shelf = new Shelf({
    realtime: { "1.0.0": { audience: "^1.0.0" } },
    storage: { "1.0.0": { audience: "^1.4.0" } },
    audience: { "1.0.0": {}, "1.4.0": {} },
  });

  const settled = resolve(
    wanted({ realtime: "^1.0.0", storage: "^1.0.0" }),
    shelf,
  );
  assertEquals(
    settled.packages.filter((entry) => entry.name === "audience").length,
    1,
    "audience was mounted twice",
  );
  assertEquals(
    settled.packages
      .find((entry) => entry.name === "audience")
      ?.version.toString(),
    "1.4.0",
    "the shared version answers only one of the two",
  );
});

Deno.test("two majors of the same package stop resolution", () => {
  const shelf = new Shelf({
    realtime: { "1.0.0": { audience: "^1.0.0" } },
    storage: { "1.0.0": { audience: "^2.0.0" } },
    audience: { "1.0.0": {}, "2.0.0": {} },
  });

  assertThrows(
    () => resolve(wanted({ realtime: "^1.0.0", storage: "^1.0.0" }), shelf),
    ResolutionError,
    "no version answers both",
  );
});

Deno.test("the conflict names both packages that asked", () => {
  const shelf = new Shelf({
    realtime: { "1.0.0": { audience: "^1.0.0" } },
    storage: { "1.0.0": { audience: "^2.0.0" } },
    audience: { "1.0.0": {}, "2.0.0": {} },
  });

  const raised = assertThrows(() => resolve(wanted({ realtime: "^1.0.0", storage: "^1.0.0" }), shelf)) as Error;
  assertEquals(
    raised.message.includes("realtime 1.0.0"),
    true,
    "the message does not name realtime",
  );
  assertEquals(
    raised.message.includes("storage 1.0.0"),
    true,
    "the message does not name storage",
  );
});

Deno.test("a dependency nobody publishes stops resolution", () => {
  const shelf = new Shelf({ realtime: { "1.0.0": { audience: "^1.0.0" } } });

  assertThrows(
    () => resolve(wanted({ realtime: "^1.0.0" }), shelf),
    ResolutionError,
    "no package of that name exists",
  );
});

Deno.test("a constraint no published version answers stops resolution", () => {
  const shelf = new Shelf({ audience: { "1.0.0": {} } });

  assertThrows(
    () => resolve(wanted({ audience: "^2.0.0" }), shelf),
    ResolutionError,
    "has no version answering",
  );
});

Deno.test(
  "resolution backtracks when the first version taken leaves nothing",
  () => {
    const shelf = new Shelf({
      realtime: {
        "1.1.0": { audience: "^2.0.0" },
        "1.0.0": { audience: "^1.0.0" },
      },
      audience: { "1.0.0": {} },
    });

    const settled = resolve(wanted({ realtime: "^1.0.0" }), shelf);
    assertEquals(
      settled.packages
        .find((entry) => entry.name === "realtime")
        ?.version.toString(),
      "1.0.0",
      "the version that leaves nothing to pick was kept",
    );
  },
);

Deno.test("two packages that need each other still resolve", () => {
  const shelf = new Shelf({
    realtime: { "1.0.0": { audience: "^1.0.0" } },
    audience: { "1.0.0": { realtime: "^1.0.0" } },
  });

  const settled = resolve(wanted({ realtime: "^1.0.0" }), shelf);
  assertEquals(
    settled.packages.map((entry) => entry.name),
    ["audience", "realtime"],
    "a circle was not resolved",
  );
});
