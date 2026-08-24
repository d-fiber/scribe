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

import { join } from "@std/path";
import type { Resolution } from "../resolution/solver.ts";
import { resolve } from "../resolution/solver.ts";
import { WorkspaceRegistry } from "../resolution/registry.ts";
import { Constraint } from "@scribe/alchemy";
import type { DiscoveredPackage } from "../workspace/discovery.ts";
import { discover } from "../workspace/discovery.ts";
import { IMPORT_MAP_FILE, RUNTIME_DIRECTORY, writeImportMap } from "./import_map.ts";
import { writeLock } from "./lock.ts";
import { writeRegistrations } from "./registrations.ts";
import { writeResolution } from "./resolution.ts";

/** What one emission is asked for. */
export interface Emission {
  /** The directories the packages are looked for under. */
  readonly roots: readonly string[];

  /** The directory the four files are written into, created when it is not there. */
  readonly into: string;

  /**
   * The packages the project named itself, each against the versions it accepts.
   *
   * @remarks
   * Every package found is wanted when this is left out, which is what the framework's own checkout
   * does with its own tree. A project names what it wants, and gets the rest behind it.
   */
  readonly wants?: ReadonlyMap<string, Constraint>;

  /**
   * The directories of code that reach the wanted packages without being one.
   *
   * @remarks
   * This is where a project's own sources live. Each of them reaches what the project named and
   * nothing pulled in behind it, so a package a dependency dragged along stays unreachable from
   * code that never asked for it.
   */
  readonly consumers?: readonly string[];

  /** The absolute path of the language's surface, which every package reaches to declare itself. */
  readonly language?: string;

  /** What answers each specifier the workspace allows outside the framework. */
  readonly imports?: ReadonlyMap<string, string>;
}

/**
 * Resolves what `asked` wants and writes the four files the rest of the toolchain obeys.
 *
 * @remarks
 * Three of them are ours and sit at the top: `resolution.json`, what was decided; `registrations.ts`,
 * what the host imports; `scribe.lock`, what we pinned. The fourth is Deno's, and it sits in
 * {@link RUNTIME_DIRECTORY} under it, so that nothing shaped for a runtime is mixed in with what a
 * person reads.
 *
 * What they are called is settled here rather than by each caller: they are read by Deno, by the CLI
 * that renders a project and by the host, none of which would agree on a name by accident.
 *
 * @returns What the project ends up with, so that a caller can say how many packages it got.
 * @throws {ResolutionError} When the wants cannot be satisfied together.
 * @throws {EmissionError} When the packages depend on each other in a circle.
 */
export async function emit(asked: Emission): Promise<Resolution> {
  const packages = await discover(asked.roots);
  const wants = asked.wants ?? everyOne(packages);
  const resolution = resolve(wants, new WorkspaceRegistry(packages));

  const mounted = kept(packages, resolution.packages.map((entry) => entry.name));
  const may = [...wants.keys()];

  await writeImportMap(mounted, join(asked.into, RUNTIME_DIRECTORY, IMPORT_MAP_FILE), {
    consumers: (asked.consumers ?? []).map((directory) => ({ directory, may })),
    language: asked.language,
    imports: asked.imports,
  });
  await writeResolution(resolution, packages, join(asked.into, "resolution.json"));
  await writeRegistrations(resolution, packages, join(asked.into, "registrations.ts"));
  await writeLock(resolution, packages, join(asked.into, "scribe.lock"));

  return resolution;
}

function everyOne(packages: readonly DiscoveredPackage[]): Map<string, Constraint> {
  return new Map(packages.map((found) => [found.declaration.name, Constraint.any()]));
}

function kept(packages: readonly DiscoveredPackage[], names: readonly string[]): DiscoveredPackage[] {
  const mounted = new Set(names);
  return packages.filter((found) => mounted.has(found.declaration.name));
}
