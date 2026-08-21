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
import type { Declaration } from "../declaration/declaration.ts";
import { manifestFrom } from "../declaration/manifest.ts";
import { BuilderError } from "../errors.ts";
import { detectExports, detectProvided } from "./detect.ts";
import { outsideOf } from "./imports.ts";
import { MANIFEST_FILE } from "./layout.ts";

/** Raised when a directory carries a manifest that cannot be read. */
export class DiscoveryError extends BuilderError {}

/** A package found on disk, with what its manifest says and what its tree adds. */
export interface DiscoveredPackage {
  /** What the manifest declares, completed by what the tree holds. */
  readonly declaration: Declaration;

  /** The absolute path of the directory the package lives in. */
  readonly directory: string;

  /** The absolute path of the manifest the declaration was read from. */
  readonly manifest: string;
}

const SKIPPED = new Set([".git", ".generated", ".scribe", "node_modules"]);

/**
 * Every package under `roots`, sorted by name.
 *
 * @remarks
 * The walk stops at a package instead of entering it, because a package's own subdirectories carry
 * the same names it does. Nothing here executes a package: a manifest is read as text and a tree is
 * read as files, so a broken package is a message rather than whatever its code would have done on
 * import.
 */
export async function discover(roots: readonly string[]): Promise<DiscoveredPackage[]> {
  const found: DiscoveredPackage[] = [];

  for (const root of roots) {
    if (!(await isDirectory(root))) continue;
    await collect(root, found);
  }

  return found.sort((left, right) => left.declaration.name.localeCompare(right.declaration.name));
}

/**
 * The declaration of the package in `directory`, manifest and tree together.
 *
 * @throws {DiscoveryError} When the directory carries no manifest.
 * @throws {ManifestError} When it carries one that cannot be read.
 */
export async function loadDeclaration(directory: string): Promise<Declaration> {
  const path = join(directory, MANIFEST_FILE);
  if (!(await isFile(path))) {
    throw new DiscoveryError(`${directory} carries no ${MANIFEST_FILE}, so it is not a package.`);
  }

  const manifest = manifestFrom(await Deno.readTextFile(path), path);

  return {
    ...manifest,
    provides: await detectProvided(directory),
    exports: await detectExports(directory, manifest.name),
    imports: await outsideOf(directory),
  };
}

async function collect(directory: string, found: DiscoveredPackage[]): Promise<void> {
  if (await isFile(join(directory, MANIFEST_FILE))) {
    found.push({
      declaration: await loadDeclaration(directory),
      directory,
      manifest: join(directory, MANIFEST_FILE),
    });
    return;
  }

  for await (const entry of Deno.readDir(directory)) {
    if (!entry.isDirectory || SKIPPED.has(entry.name)) continue;
    await collect(join(directory, entry.name), found);
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}
