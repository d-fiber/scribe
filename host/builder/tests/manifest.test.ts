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

import { DeclarationError, DEFAULT_DESCRIPTION, handsOverNothing, VersionError } from "@scribe/alchemy";
import { assertEquals, assertThrows } from "@std/assert";
import { chainOf, ManifestError, manifestFrom, manifestSource } from "../src/client/pkg/declaration/manifest.ts";

const WHERE = "audiences/package.yaml";
const ENVIRONMENT = 'environment:\n  scribe: "^3.0.0"\n';

Deno.test("a manifest reads into what a package says about itself", () => {
  const declared = manifestFrom(
    `name: realtime
description: Broadcasts a row's life to the callers a channel lets in.
version: 1.2.0

${ENVIRONMENT}
dependencies:
  audiences: "^1.0.0"
`,
    WHERE,
  );

  assertEquals(declared.name, "realtime", "the manifest lost its name");
  assertEquals(
    declared.description,
    "Broadcasts a row's life to the callers a channel lets in.",
    "the manifest lost its description",
  );
  assertEquals(
    declared.version.toString(),
    "1.2.0",
    "the manifest lost its version",
  );
  assertEquals(
    declared.scribe.toString(),
    "^3.0.0",
    "the manifest lost the framework it runs on",
  );
  assertEquals(
    declared.dependencies["audiences"]?.toString(),
    "^1.0.0",
    "the manifest lost its dependency",
  );
});

Deno.test(
  "a manifest holding only a name, a version and a framework is enough",
  () => {
    const declared = manifestFrom(
      `name: audiences\nversion: 0.1.0\n${ENVIRONMENT}`,
      WHERE,
    );

    assertEquals(declared.name, "audiences", "the manifest lost its name");
    assertEquals(
      declared.description,
      DEFAULT_DESCRIPTION,
      "a package nobody described was described anyway",
    );
    assertEquals(
      Object.keys(declared.dependencies).length,
      0,
      "a manifest that asks for nothing carries a dependency",
    );
  },
);

Deno.test("a manifest with no name is refused", () => {
  assertThrows(
    () => manifestFrom("version: 1.0.0\n", WHERE),
    ManifestError,
    'has no "name:"',
  );
});

Deno.test("a manifest with no version is refused", () => {
  assertThrows(
    () => manifestFrom("name: audiences\n", WHERE),
    ManifestError,
    'has no "version:"',
  );
});

Deno.test("a manifest that is not a mapping is refused", () => {
  assertThrows(
    () => manifestFrom("- audiences\n", WHERE),
    ManifestError,
    "is not a mapping",
  );
});

Deno.test("a manifest carrying a key nothing reads is refused", () => {
  assertThrows(
    () =>
      manifestFrom(
        "name: audiences\nversion: 1.0.0\nprovides:\n  sql: db/init\n",
        WHERE,
      ),
    ManifestError,
    "which means nothing",
  );
});

Deno.test("a manifest holding its dependencies as a word is refused", () => {
  assertThrows(
    () =>
      manifestFrom(
        `name: audiences\nversion: 1.0.0\n${ENVIRONMENT}dependencies: audience\n`,
        WHERE,
      ),
    ManifestError,
    "other than a block",
  );
});

Deno.test(
  "a manifest holding a constraint as something other than a word is refused",
  () => {
    assertThrows(
      () =>
        manifestFrom(
          `name: realtime\nversion: 1.0.0\n${ENVIRONMENT}dependencies:\n  audiences:\n    - 1\n`,
          WHERE,
        ),
      ManifestError,
      "other than a word",
    );
  },
);

Deno.test("a manifest that names no framework is refused", () => {
  assertThrows(
    () => manifestFrom("name: audiences\nversion: 1.0.0\n", WHERE),
    ManifestError,
    'has no "environment:"',
  );
});

Deno.test(
  "a key beside the framework in the environment block is refused",
  () => {
    assertThrows(
      () =>
        manifestFrom(
          'name: audiences\nversion: 1.0.0\nenvironment:\n  deno: "^2.0.0"\n',
          WHERE,
        ),
      ManifestError,
      "which means nothing",
    );
  },
);

Deno.test("a name the chain refuses is refused in the manifest too", () => {
  assertThrows(
    () => manifestFrom(`name: Audiences\nversion: 1.0.0\n${ENVIRONMENT}`, WHERE),
    DeclarationError,
    "cannot name",
  );
});

Deno.test("a version the chain refuses is refused in the manifest too", () => {
  assertThrows(
    () => manifestFrom('name: audiences\nversion: "1.0"\n', WHERE),
    VersionError,
    "is not a version",
  );
});

Deno.test("a version yaml reads as a number is refused by naming why", () => {
  assertThrows(
    () => manifestFrom("name: audiences\nversion: 1.0\n", WHERE),
    ManifestError,
    "which YAML reads as a number",
  );
});

Deno.test(
  "a manifest written back as typescript reads into the same manifest",
  () => {
    const source = `name: realtime
description: Broadcasts a row's life to the callers a channel lets in.
version: 1.2.0

${ENVIRONMENT}
dependencies:
  audiences: "^1.0.0"
`;
    const written = manifestSource(manifestFrom(source, WHERE));

    assertEquals(
      written.includes('import { Package } from "@scribe/alchemy";'),
      true,
      `no import: ${written}`,
    );
    assertEquals(
      written.includes('Package.named("realtime")'),
      true,
      `the name was lost: ${written}`,
    );
    assertEquals(
      written.includes('.dependsOn({"audiences":"^1.0.0"})'),
      true,
      `the dependency was lost: ${written}`,
    );
  },
);

Deno.test(
  "a manifest with nothing but a name, a version and a framework writes the shortest chain",
  () => {
    assertEquals(
      chainOf(
        manifestFrom(`name: audiences\nversion: 1.0.0\n${ENVIRONMENT}`, WHERE),
      ),
      `Package.named("audiences").describedAs(${JSON.stringify(DEFAULT_DESCRIPTION)})` +
        `.version("1.0.0").runsOn("^3.0.0").build()`,
      "the chain says more than the manifest did",
    );
  },
);

const SOUND_ARTEFACTS = `scribe:
  db:
    init: ./db/init/
    migrations: ./db/migrations/
    provisioning: ./db/provisioning/
  protocol: ./protocol/
  ops:
    - ./ops/listener/
    - ./ops/reader/
`;

function withArtefacts(block: string): string {
  return `name: audiences\nversion: 1.0.0\n${ENVIRONMENT}${block}`;
}

Deno.test("a manifest reads what a package hands the stack", () => {
  const declared = manifestFrom(withArtefacts(SOUND_ARTEFACTS), WHERE);

  assertEquals(declared.artefacts.db?.init, "db/init", "the init directory was lost");
  assertEquals(declared.artefacts.db?.migrations, "db/migrations", "the migrations directory was lost");
  assertEquals(declared.artefacts.db?.provisioning, "db/provisioning", "the provisioning directory was lost");
  assertEquals(declared.artefacts.protocol, "protocol", "the protocol directory was lost");
  assertEquals([...declared.artefacts.ops], ["ops/listener", "ops/reader"], "the services were lost");
});

Deno.test("a manifest with no scribe block hands the stack nothing", () => {
  const declared = manifestFrom(withArtefacts(""), WHERE);

  assertEquals(handsOverNothing(declared.artefacts), true, "a manifest that named nothing declared something");
});

Deno.test("two spellings of one path read as one place", () => {
  const declared = manifestFrom(withArtefacts("scribe:\n  ops:\n    - ./ops/queue/\n"), WHERE);

  assertEquals([...declared.artefacts.ops], ["ops/queue"], "the path kept the noise a person wrote");
});

Deno.test("a block with nothing under it hands over nothing, the way an empty dependencies does", () => {
  const declared = manifestFrom(withArtefacts("scribe:\n  db:\n  ops: []\n  protocol: ./protocol/\n"), WHERE);

  assertEquals(declared.artefacts.db, null, "an empty db block declared a directory");
  assertEquals(declared.artefacts.ops.length, 0, "an empty ops list declared a service");
  assertEquals(declared.artefacts.protocol, "protocol", "the protocol directory was lost");
});

Deno.test("a key the scribe block does not hold is refused by naming the ones it does", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe:\n  seeds: ./db/seeds/\n"), WHERE),
    ManifestError,
    '"scribe.seeds:", which means nothing',
  );
});

Deno.test("a key the db block does not hold is refused by naming the three moments", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe:\n  db:\n    seed: ./db/seed/\n"), WHERE),
    ManifestError,
    '"scribe.db.seed:", which means nothing',
  );
});

Deno.test("a scribe block that is not a block of paths is refused", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe: ./ops/\n"), WHERE),
    ManifestError,
    "something other than a block of paths",
  );
});

Deno.test("ops written as one path instead of a list is refused", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe:\n  ops: ./ops/\n"), WHERE),
    ManifestError,
    "something other than a list",
  );
});

Deno.test("an absolute path is refused", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe:\n  protocol: /srv/protocol/\n"), WHERE),
    DeclarationError,
    "is an absolute path",
  );
});

Deno.test("a path that climbs out of the package is refused", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe:\n  protocol: ../auth/protocol/\n"), WHERE),
    DeclarationError,
    "climbs out of the package",
  );
});

Deno.test("the same service named twice is refused", () => {
  assertThrows(
    () => manifestFrom(withArtefacts("scribe:\n  ops:\n    - ./ops/queue/\n    - ops/queue\n"), WHERE),
    DeclarationError,
    'names "ops/queue" twice',
  );
});

Deno.test("a path written empty is refused rather than read as a directory", () => {
  assertThrows(
    () => manifestFrom(withArtefacts('scribe:\n  protocol: ""\n'), WHERE),
    DeclarationError,
    "names nothing",
  );
});

Deno.test("the chain a manifest writes rebuilds the same artefacts", () => {
  const declared = manifestFrom(withArtefacts(SOUND_ARTEFACTS), WHERE);
  const written = chainOf(declared);

  assertEquals(
    written.includes(
      '.hands({"db":{"init":"db/init","migrations":"db/migrations","provisioning":"db/provisioning"},' +
        '"protocol":"protocol","ops":["ops/listener","ops/reader"]})',
    ),
    true,
    `the artefacts were lost on the way to TypeScript: ${written}`,
  );
});

Deno.test("a path the manifest never named is not written into the chain as a null", () => {
  const written = chainOf(manifestFrom(withArtefacts("scribe:\n  db:\n    init: ./db/init/\n"), WHERE));

  assertEquals(written.includes('.hands({"db":{"init":"db/init"}})'), true, `the chain says more: ${written}`);
  assertEquals(written.includes("null"), false, `a path nobody wrote was rebuilt as a null: ${written}`);
});

Deno.test("a manifest that hands over nothing writes no hands step", () => {
  assertEquals(
    chainOf(manifestFrom(withArtefacts(""), WHERE)).includes(".hands("),
    false,
    "the chain declared a block the manifest never carried",
  );
});
