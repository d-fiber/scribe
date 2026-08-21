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

/**
 * The lock file's text, listing every package the project ends up with.
 *
 * @remarks
 * A project is an application and never a library, so there is nobody downstream to keep room for:
 * the lock records exactly what was chosen and the next resolution starts from it. Each entry says
 * whether the project asked for the package itself, which is what tells a reader why a package
 * they never wrote down is on their machine.
 *
 * The source and the digest of each package join these lines when the shared cache exists. Until
 * then a package comes from the checkout, and writing a digest of something nobody downloaded
 * would be a field that looks verified and is not.
 */
export function lockText(
  resolution: Resolution,
  packages: readonly DiscoveredPackage[],
): string {
  const found = new Map(
    packages.map((entry) => [entry.declaration.name, entry]),
  );
  const lines: string[] = ["packages:"];

  for (const resolved of resolution.packages) {
    lines.push(`  ${resolved.name}:`);
    lines.push(`    version: ${resolved.version}`);
    lines.push(`    dependency: ${resolved.direct ? "direct" : "transitive"}`);

    const dependencies = found.get(resolved.name)?.declaration.dependencies ?? new Map();
    if (dependencies.size === 0) continue;

    lines.push("    needs:");
    for (const [name, constraint] of [...dependencies].sort(([left], [right]) => left.localeCompare(right))) {
      lines.push(`      ${name}: "${constraint}"`);
    }
  }

  return `${lines.join("\n")}\n`;
}

/** Writes the lock file to `at`, creating the directory that holds it. */
export async function writeLock(
  resolution: Resolution,
  packages: readonly DiscoveredPackage[],
  at: string,
): Promise<void> {
  await Deno.mkdir(dirname(at), { recursive: true });
  await Deno.writeTextFile(at, lockText(resolution, packages));
}
