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

import { join, relative } from "@std/path";
import { SCOPE } from "../../../scope.ts";

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g;

const SKIPPED = new Set([".git", ".generated", ".scribe", "node_modules"]);

const SCHEMED = /^[a-z][a-z0-9+.-]*:/;

/** One import a package writes, as its source file writes it. */
interface Reference {
  /** The specifier as written, such as `@scribe/audiences` or `ioredis`. */
  readonly specifier: string;

  /** The path of the file holding the import, relative to the package it belongs to. */
  readonly file: string;
}

/**
 * Every specifier written from inside `directory` that belongs to neither the framework nor a
 * relative path.
 *
 * @remarks
 * This reads the text of the sources rather than a parsed module graph, the same way the ops
 * fragments are read line by line and for a comparable reason: the map that makes a specifier
 * resolve is written out of this answer, so nothing can be resolved while it is being found. The
 * cost is that a specifier built at runtime is invisible here, which no package does.
 *
 * A specifier carrying a scheme, `npm:` or `jsr:` or `https:`, is left out: it says on its own what
 * answers it, so nothing has to be settled for it. What is left is the bare names, which resolve
 * only through a map, and that map is written once for the whole workspace.
 */
export async function outsideOf(directory: string): Promise<Set<string>> {
  const found = new Set<string>();

  for (const reference of await specifiersOf(directory)) {
    if (reference.specifier.startsWith(SCOPE) || SCHEMED.test(reference.specifier)) continue;
    found.add(reference.specifier);
  }

  return found;
}

async function specifiersOf(directory: string): Promise<Reference[]> {
  const found: Reference[] = [];

  for await (const file of sourcesOf(directory)) {
    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(SPECIFIER)) {
      const specifier = match[1];
      if (specifier.startsWith(".")) continue;
      found.push({ specifier, file: relative(directory, file) });
    }
  }

  return found.sort((left, right) =>
    left.file.localeCompare(right.file) || left.specifier.localeCompare(right.specifier)
  );
}

async function* sourcesOf(directory: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(directory)) {
    const path = join(directory, entry.name);
    if (entry.isDirectory) {
      if (SKIPPED.has(entry.name)) continue;
      yield* sourcesOf(path);
      continue;
    }
    if (entry.isFile && (path.endsWith(".ts") || path.endsWith(".tsx"))) yield path;
  }
}
