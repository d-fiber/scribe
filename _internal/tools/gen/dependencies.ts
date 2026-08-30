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

/**
 * One third-party dependency this repository resolves against a registry, as
 * `_internal/dependencies.json` declares it.
 */
interface Dependency {
  /** The specifier `deno.json` resolves, exactly as an importer writes it. */
  readonly specifier: string;

  /** Which registry this dependency comes from. */
  readonly registry: "npm" | "jsr";

  /** The package name, when it differs from `specifier` — a renamed alias, or a subpath export. */
  readonly package?: string;

  /** The version this repository pins. */
  readonly version: string;

  /** What `specifier` reaches past the package root, when it reaches past it at all. */
  readonly subpath?: string;

  /**
   * Whether this entry reads a literal file path instead of the package's own `exports` map.
   *
   * @remarks
   * Deno spells this with an extra slash, `npm:/pkg@version/path`. It is what a directory mapping
   * and a bundled file the package does not declare as an export both need.
   */
  readonly raw?: boolean;
}

const ROOT = new URL("../../../", import.meta.url);
const MANIFEST_PATH = new URL("dependencies.json", new URL("../../", import.meta.url));
const DENO_JSON_PATH = new URL("deno.json", ROOT);

/** The value `deno.json` carries for `dep`, in the form Deno's import map expects. */
function importValue(dep: Dependency): string {
  const pkg = dep.package ?? dep.specifier;
  const base = `${dep.registry}:${dep.raw ? "/" : ""}${pkg}@${dep.version}`;
  return dep.subpath === undefined ? base : `${base}/${dep.subpath}`;
}

/** Whether `specifier` is one this generator never touches, because the workspace owns it. */
function isWorkspaceOwned(specifier: string): boolean {
  return specifier.startsWith("@scribe/");
}

async function main(): Promise<void> {
  const dependencies: Dependency[] = JSON.parse(await Deno.readTextFile(MANIFEST_PATH));
  const config = JSON.parse(await Deno.readTextFile(DENO_JSON_PATH));

  const kept = Object.fromEntries(
    Object.entries(config.imports).filter(([specifier]) => isWorkspaceOwned(specifier)),
  );
  const generated = Object.fromEntries(
    dependencies.map((dep) => [dep.specifier, importValue(dep)]),
  );

  const merged = { ...kept, ...generated };
  config.imports = Object.fromEntries(
    Object.keys(merged).sort().map((specifier) => [specifier, merged[specifier]]),
  );

  await Deno.writeTextFile(DENO_JSON_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

if (import.meta.main) await main();
