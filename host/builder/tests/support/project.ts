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
import { entryOf, LIBRARY_DIRECTORY, MANIFEST_FILE } from "../../client/project/layout.ts";

/** What a written project declares, beyond the name it is written under. */
export interface WrittenProject {
  /** The version its manifest publishes, `1.0.0` when the test does not care. */
  readonly version?: string;
  /** The framework versions it accepts, `^1.0.0` when the test does not care. */
  readonly scribe?: string;
  /**
   * The files it holds, from a path relative to the project to its text.
   *
   * @remarks
   * A file is written with whatever text the test gives, the empty string included: nothing here
   * reads TypeScript, so a route is a path on disk and its content is the compiler's business.
   */
  readonly files?: Readonly<Record<string, string>>;
}

/**
 * Writes a project called `name` under `root`, and answers its directory.
 *
 * @remarks
 * Only the manifest and the entry are written on the test's behalf. A fixture is a project these
 * tools can read rather than one a person would be happy to open.
 */
export async function writeProject(root: string, name: string, written: WrittenProject = {}): Promise<string> {
  const directory = join(root, name);
  const files: Record<string, string> = {
    [MANIFEST_FILE]: manifestText(name, written),
    [entryOf(name)]: "export {};\n",
    ...written.files,
  };
  for (const [path, text] of Object.entries(files)) await write(join(directory, path), text);
  return directory;
}

/** Writes the tree of a project's `lib/src/`, from a path under it to the file's text. */
export async function writeSources(directory: string, tree: Readonly<Record<string, string>>): Promise<void> {
  for (const [path, text] of Object.entries(tree)) {
    await write(join(directory, LIBRARY_DIRECTORY, "src", path), text);
  }
}

/** The manifest text a project with `written` would carry. */
export function manifestText(name: string, written: WrittenProject = {}): string {
  return [
    `name: ${name}`,
    `version: ${written.version ?? "1.0.0"}`,
    "",
    "environment:",
    `  scribe: "${written.scribe ?? "^1.0.0"}"`,
    "",
  ].join("\n");
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
