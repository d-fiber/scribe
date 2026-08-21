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
import type { Provided } from "../declaration/declaration.ts";
import {
  entryOf,
  LIBRARY_DIRECTORY,
  OPS_DIRECTORY,
  PROTOCOL_DIRECTORY,
  SQL_DIRECTORY,
  TESTING_DIRECTORY,
  TESTS_DIRECTORY,
} from "./layout.ts";

/**
 * What the package in `directory` poses on the machine, found by looking for it.
 *
 * @remarks
 * The three directories are conventions the toolchain already reads. Asking a package to name them
 * as well would put the same fact in two places, and the one that would be wrong is the manifest,
 * since the tree is what actually gets played.
 */
export async function detectProvided(directory: string): Promise<Provided> {
  return {
    sql: (await isDirectory(join(directory, SQL_DIRECTORY))) ? SQL_DIRECTORY : null,
    ops: (await isDirectory(join(directory, OPS_DIRECTORY))) ? OPS_DIRECTORY : null,
    protocol: (await isDirectory(join(directory, PROTOCOL_DIRECTORY))) ? PROTOCOL_DIRECTORY : null,
  };
}

/**
 * The public surface of the package called `name` in `directory`.
 *
 * @remarks
 * Every file sitting directly in `lib/` is an entry, and so is every file sitting directly in
 * `tests/testing/`. In each of the two, the file named after the package is the entry of its
 * directory, so `lib/realtime.ts` answers `@scribe/realtime` and `tests/testing/realtime.ts`
 * answers `@scribe/realtime/testing`, while their neighbours answer under their own names.
 *
 * Nothing deeper is reachable. `lib/src/` is where the code goes, and it is private by never being
 * named here.
 */
export async function detectExports(directory: string, name: string): Promise<Map<string, string>> {
  const exports = new Map<string, string>([[".", `./${entryOf(name)}`]]);

  for (const file of await filesIn(join(directory, LIBRARY_DIRECTORY))) {
    if (file === `${name}.ts`) continue;
    exports.set(`./${file.slice(0, -3)}`, `./${LIBRARY_DIRECTORY}/${file}`);
  }

  const testing = join(directory, TESTS_DIRECTORY, TESTING_DIRECTORY);
  for (const file of await filesIn(testing)) {
    const under = `${TESTS_DIRECTORY}/${TESTING_DIRECTORY}`;
    const entry = file === `${name}.ts` ? `./${TESTING_DIRECTORY}` : `./${TESTING_DIRECTORY}/${file.slice(0, -3)}`;
    exports.set(entry, `./${under}/${file}`);
  }

  return exports;
}

async function filesIn(directory: string): Promise<string[]> {
  const found: string[] = [];

  try {
    for await (const entry of Deno.readDir(directory)) {
      if (entry.isFile && entry.name.endsWith(".ts")) found.push(entry.name);
    }
  } catch {
    return found;
  }

  return found.sort();
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}
