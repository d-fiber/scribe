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
import type { DiscoveredPackage } from "../workspace/discovery.ts";
import { LANGUAGE, SCOPE } from "../../../scope.ts";
import { specifierFrom } from "../../../paths.ts";

/**
 * The directory holding what Deno reads, and nothing else.
 *
 * @remarks
 * What the emission writes is read by three different things, and only one of them is a runtime.
 * Giving Deno a directory of its own costs one segment and keeps its vocabulary out of the files a
 * person opens: `resolution.json`, `registrations.ts` and `scribe.lock` say what was decided, and
 * everything shaped for Deno sits under here.
 */
export const RUNTIME_DIRECTORY = ".deno";

/** The import map Deno is handed, inside {@link RUNTIME_DIRECTORY}. */
export const IMPORT_MAP_FILE = "imports.json";

/** One directory of code, with the packages the map lets it reach. */
export interface Consumer {
  /** The absolute path of the directory the entry applies to. */
  readonly directory: string;

  /**
   * The names of the packages the code under it may import.
   *
   * @remarks
   * Whatever the workspace settled outside the framework is granted on top of these, in full. A
   * package is granted only the outside specifiers it writes itself, so that a neighbour never
   * inherits what it never asked for; a consumer is the project's own code and has no neighbour to
   * be told apart from.
   */
  readonly may: readonly string[];
}

/** What the map is asked to grant, beyond what each package declared for itself. */
export interface ImportMapOptions {
  /** The directories of code that reach packages without being one, each with what it may reach. */
  readonly consumers?: readonly Consumer[];

  /**
   * The absolute path of the language's surface, which every package reaches to declare itself.
   *
   * @remarks
   * It is a path and never a registry specifier, because the half that writes the registrations
   * and the half those registrations import have to be the same copy. A framework checkout carries
   * one, so the map points at it.
   *
   * Left out when the packages are read for something other than a run.
   */
  readonly language?: string;

  /**
   * What answers each specifier the workspace allows outside the framework.
   *
   * @remarks
   * It is settled once, here, and handed to each package only for the specifiers that package
   * actually writes. A version of something nobody owns therefore lives in one place, and a
   * neighbour that never imported it is never granted it.
   */
  readonly imports?: ReadonlyMap<string, string>;
}

/** The map Deno is handed, and the only place a package specifier turns into a file. */
export interface ImportMap {
  /**
   * What resolves from anywhere.
   *
   * It holds the language and nothing else. Every package declares itself with it, so putting it in
   * a scope would mean writing the same grant once per package; everything else is scoped to the
   * directory that earned it, and a specifier written where it was not declared falls back on
   * nothing.
   */
  readonly imports: Readonly<Record<string, string>>;

  /** What resolves from inside one directory, from that directory to the specifiers it may write. */
  readonly scopes: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

/**
 * The map that lets each package reach what it declared, and lets nothing reach anything else.
 *
 * @remarks
 * A package's scope holds the packages it declared and whatever it declared outside the framework,
 * which is the whole of what its files may write.
 *
 * Two things are closed here rather than by a rule somebody has to run. Only the entries a package
 * exports are written, so `@scribe/realtime/src/anything.ts` resolves nowhere and the private half
 * of a package stays private. And every grant sits in the scope of the directory that declared it,
 * so a package pulled in behind another is on disk, is mounted, and is unreachable from code that
 * did not ask for it. Both failures read as Deno's own "not a dependency and not in import map".
 *
 * Addresses are resolved against the map's own location, scoped or not, so a scope key and the
 * paths under it are both written from where the map is written.
 */
export function importMapFor(
  packages: readonly DiscoveredPackage[],
  at: string,
  options: ImportMapOptions = {},
): ImportMap {
  const from = dirname(at);
  const surfaces = new Map(
    packages.map((found) => [found.declaration.name, surfaceOf(found, from)]),
  );
  const scopes: Record<string, Record<string, string>> = {};

  for (const found of packages) {
    const granted = sorted({
      ...reachable(Object.keys(found.declaration.dependencies), surfaces),
      ...answered(found.declaration.imports, options.imports),
    });

    if (Object.keys(granted).length === 0) continue;
    scopes[scopeOf(from, found.directory)] = granted;
  }

  for (const consumer of options.consumers ?? []) {
    scopes[scopeOf(from, consumer.directory)] = sorted({
      ...reachable(consumer.may, surfaces),
      ...Object.fromEntries(options.imports ?? []),
    });
  }

  const imports: Record<string, string> = {};
  if (options.language !== undefined) {
    imports[LANGUAGE] = specifierFrom(from, options.language);
  }

  return { imports, scopes: sortedScopes(scopes) };
}

/** Writes the map for `packages` to `at`, creating the directory that holds it. */
export async function writeImportMap(
  packages: readonly DiscoveredPackage[],
  at: string,
  options: ImportMapOptions = {},
): Promise<void> {
  await Deno.mkdir(dirname(at), { recursive: true });
  await Deno.writeTextFile(
    at,
    `${JSON.stringify(importMapFor(packages, at, options), null, 2)}\n`,
  );
}

function surfaceOf(
  found: DiscoveredPackage,
  from: string,
): Record<string, string> {
  const surface: Record<string, string> = {};

  for (const [entry, file] of found.declaration.exports) {
    const specifier = entry === "."
      ? `${SCOPE}${found.declaration.name}`
      : `${SCOPE}${found.declaration.name}/${entry.slice(2)}`;
    surface[specifier] = specifierFrom(from, join(found.directory, file));
  }

  return surface;
}

function answered(
  written: ReadonlySet<string>,
  imports: ReadonlyMap<string, string> | undefined,
): Record<string, string> {
  if (imports === undefined) return {};

  const granted: Record<string, string> = {};
  for (const specifier of written) {
    const answer = imports.get(specifier);
    if (answer !== undefined) granted[specifier] = answer;
  }

  return granted;
}

function reachable(
  names: readonly string[],
  surfaces: ReadonlyMap<string, Record<string, string>>,
): Record<string, string> {
  const reached: Record<string, string> = {};
  for (const name of names) Object.assign(reached, surfaces.get(name) ?? {});
  return sorted(reached);
}

function scopeOf(from: string, directory: string): string {
  const path = specifierFrom(from, directory);
  return path.endsWith("/") ? path : `${path}/`;
}

function sorted(entries: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function sortedScopes(
  scopes: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  return Object.fromEntries(
    Object.entries(scopes).sort(([left], [right]) => left.localeCompare(right)),
  );
}
