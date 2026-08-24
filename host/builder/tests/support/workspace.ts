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
import { entryOf, MANIFEST_FILE } from "../../src/workspace/layout.ts";

/** What a written package declares, beyond the name it is written under. */
export interface WrittenPackage {
  /** What its manifest says it is for, left out when the test does not care. */
  readonly description?: string;

  /** The version its manifest publishes, `1.0.0` when the test does not care. */
  readonly version?: string;

  /** The framework versions it accepts, `^1.0.0` when the test does not care. */
  readonly scribe?: string;

  /** The packages it asks for, from a name to the constraint it accepts. */
  readonly dependencies?: Readonly<Record<string, string>>;

  /**
   * The files it holds, from a path relative to the package to its text.
   *
   * @remarks
   * The entry is written for the test when it names none, since a package the tools can read is one
   * they can reach through `lib/<name>.ts`.
   */
  readonly files?: Readonly<Record<string, string>>;
}

/**
 * Writes a package called `name` under `root`, and answers its directory.
 *
 * @remarks
 * Only the manifest and the entry are written on the test's behalf. What a package must carry
 * beyond them is `scribedev pkg check`'s to say, so a fixture here is a package these tools can
 * read rather than one that would pass that check.
 */
export async function writePackage(root: string, name: string, written: WrittenPackage = {}): Promise<string> {
  const directory = join(root, name);
  const files: Record<string, string> = {
    [MANIFEST_FILE]: manifestText(name, written),
    [entryOf(name)]: "export {};\n",
    ...written.files,
  };

  for (const [path, text] of Object.entries(files)) await write(join(directory, path), text);
  return directory;
}

/** The manifest text a package with `written` would carry. */
export function manifestText(name: string, written: WrittenPackage = {}): string {
  const lines = [`name: ${name}`];
  if (written.description !== undefined) lines.push(`description: ${written.description}`);
  lines.push(`version: ${written.version ?? "1.0.0"}`);
  lines.push("", "environment:", `  scribe: "${written.scribe ?? "^1.0.0"}"`);

  if (written.dependencies !== undefined) {
    lines.push("", "dependencies:");
    for (const [held, value] of Object.entries(written.dependencies)) lines.push(`  ${held}: "${value}"`);
  }

  return `${lines.join("\n")}\n`;
}

/** A directory the test owns, removed when `body` is done with it. */
export async function inTemporaryRoot(body: (root: string) => Promise<void>): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: "scribe_builder_" });
  try {
    await body(root);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
}

async function write(path: string, text: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, text);
}
