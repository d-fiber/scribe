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

import { dirname } from "@std/path";
import type { Resolution } from "../resolution/solver.ts";
import type { DiscoveredPackage } from "../workspace/discovery.ts";
import { specifierFrom } from "../../../paths.ts";

/** One package of the resolution, as the toolchain outside this program reads it. */
export interface EmittedPackage {
  /** The package's name. */
  readonly name: string;

  /** The version settled on. */
  readonly version: string;

  /** Whether the project named this package itself, rather than getting it behind another. */
  readonly direct: boolean;

  /** Where the package sits, relative to the file this document is written to. */
  readonly directory: string;

  /**
   * Where the SQL it hands over sits, one path per moment Postgres plays it at.
   *
   * @remarks
   * Read from the manifest rather than looked for. A directory nobody declared hands over nothing,
   * so guessing at a conventional name would put a package's SQL into a stack the package never
   * offered it to.
   */
  readonly sql: EmittedSql;

  /** The ops directories it hands over, one per service, in the order the manifest wrote them. */
  readonly ops: readonly string[];

  /** Where its `.proto` files sit inside the package, or null when it speaks to no worker. */
  readonly protocol: string | null;
}

/** The SQL one package hands over, each path relative to that package. */
export interface EmittedSql {
  /** Where the SQL played once, at the build of the database container, is harvested from. */
  readonly init: string | null;

  /** Where the SQL played at every start is harvested from. */
  readonly migrations: string | null;

  /** Where the SQL played before anything else is harvested from. */
  readonly provisioning: string | null;
}

/** The whole resolution, in the shape the CLI reads instead of walking the tree itself. */
export interface ResolutionDocument {
  /** Every package the project ends up with, sorted by name. */
  readonly packages: readonly EmittedPackage[];
}

/**
 * The resolution as a document, so that whoever needs it stops discovering packages on its own.
 *
 * @remarks
 * The Dart side used to descend two roots and recognise a module by the artefacts its directory
 * carried, which is a second definition of what a package is and therefore a second one to keep in
 * step. It reads this instead, and keeps what it alone can do with the paths named here.
 *
 * The paths come from each manifest's `scribe:` block and from nowhere else. A package that
 * declares none hands over none, which is why a package with a `db/` directory it never named
 * appears here with nothing under `sql`.
 */
export function resolutionDocument(
  resolution: Resolution,
  packages: readonly DiscoveredPackage[],
  at: string,
): ResolutionDocument {
  const from = dirname(at);
  const found = new Map(
    packages.map((entry) => [entry.declaration.name, entry]),
  );

  return {
    packages: resolution.packages.map((resolved) => {
      const declaration = found.get(resolved.name)?.declaration;
      const directory = found.get(resolved.name)?.directory ?? "";

      return {
        name: resolved.name,
        version: resolved.version.toString(),
        direct: resolved.direct,
        directory: specifierFrom(from, directory),
        sql: {
          init: declaration?.artefacts.db?.init ?? null,
          migrations: declaration?.artefacts.db?.migrations ?? null,
          provisioning: declaration?.artefacts.db?.provisioning ?? null,
        },
        ops: [...(declaration?.artefacts.ops ?? [])],
        protocol: declaration?.artefacts.protocol ?? null,
      };
    }),
  };
}

/** Writes the resolution document to `at`, creating the directory that holds it. */
export async function writeResolution(
  resolution: Resolution,
  packages: readonly DiscoveredPackage[],
  at: string,
): Promise<void> {
  await Deno.mkdir(dirname(at), { recursive: true });
  await Deno.writeTextFile(
    at,
    `${JSON.stringify(resolutionDocument(resolution, packages, at), null, 2)}\n`,
  );
}
