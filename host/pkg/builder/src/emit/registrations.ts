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

import { dirname, join } from "@std/path";
import { chainOf } from "../declaration/manifest.ts";
import { BuilderError } from "../errors.ts";
import type { Resolution } from "../resolution/solver.ts";
import type { DiscoveredPackage } from "../workspace/discovery.ts";
import { DRIVER } from "../workspace/scope.ts";
import { entryOf } from "../workspace/layout.ts";
import { specifierFrom } from "./paths.ts";

/** Raised when the packages cannot be put in an order the host can start them in. */
export class EmissionError extends BuilderError {}

/**
 * The source of the file the host imports to reach every mounted package.
 *
 * @remarks
 * Each package arrives as two halves put back together: the declaration, rebuilt in TypeScript from
 * what its `package.yaml` held, and its entry module, which is where the steps of its lifecycle
 * live because a manifest holds values and those are functions.
 *
 * The packages are listed dependency first, so a package that starts is always reached after the
 * ones it was allowed to import. That order is what makes a start step usable at all: a package
 * whose dependency has not run yet would have to check at every call whether the thing it needs is
 * up.
 *
 * @throws {EmissionError} When the packages depend on each other in a circle.
 */
export function registrationsSource(
  resolution: Resolution,
  packages: readonly DiscoveredPackage[],
  at: string,
): string {
  const from = dirname(at);
  const found = new Map(
    packages.map((entry) => [entry.declaration.name, entry]),
  );
  const ordered = dependenciesFirst(resolution, found);

  const lines: string[] = [
    `import { mount, Package } from ${JSON.stringify(DRIVER)};`,
  ];
  for (const name of ordered) {
    const entry = join(found.get(name)!.directory, entryOf(name));
    lines.push(
      `import * as ${name} from ${JSON.stringify(specifierFrom(from, entry))};`,
    );
  }

  lines.push("");
  lines.push(
    "/** Every package this project mounts, the ones a dependency pulled in included, dependency first. */",
  );
  lines.push("export const declarations = [");
  for (const name of ordered) {
    lines.push(`  mount(${chainOf(found.get(name)!.declaration)}, ${name}),`);
  }
  lines.push("];");

  return `${lines.join("\n")}\n`;
}

/** Writes the registrations file to `at`, creating the directory that holds it. */
export async function writeRegistrations(
  resolution: Resolution,
  packages: readonly DiscoveredPackage[],
  at: string,
): Promise<void> {
  await Deno.mkdir(dirname(at), { recursive: true });
  await Deno.writeTextFile(at, registrationsSource(resolution, packages, at));
}

function dependenciesFirst(
  resolution: Resolution,
  found: ReadonlyMap<string, DiscoveredPackage>,
): string[] {
  const mounted = new Set(resolution.packages.map((resolved) => resolved.name));
  const ordered: string[] = [];
  const settled = new Set<string>();
  const walking = new Set<string>();

  function visit(name: string, trail: readonly string[]): void {
    if (settled.has(name)) return;
    if (walking.has(name)) {
      throw new EmissionError(
        `${[...trail, name].join(" needs ")}, which is a circle.`,
      );
    }

    walking.add(name);
    for (
      const dependency of found.get(name)?.declaration.dependencies.keys() ??
        []
    ) {
      if (mounted.has(dependency)) visit(dependency, [...trail, name]);
    }
    walking.delete(name);

    settled.add(name);
    ordered.push(name);
  }

  for (const resolved of resolution.packages) visit(resolved.name, []);
  return ordered;
}
