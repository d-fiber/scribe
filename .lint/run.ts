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

import ts from "typescript";
import { RULES } from "./rules.ts";

const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

/**
 * Directories this run never walks into.
 *
 * `sdk/js/gen` and `sdk/js/example` are generated code and an example, the same two `deno lint`
 * itself leaves alone. `.git` holds no source. Anything else under the root is in scope, `.lint/`
 * included, even though none of the three rules today have anything to say about a file there.
 */
const EXCLUDED_DIRECTORIES = [".git", "sdk/js/gen", "sdk/js/example"];

/** Every `.ts` file under `root`, skipping {@link EXCLUDED_DIRECTORIES}. */
async function collectFiles(root: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      const path = `${directory}/${entry.name}`;
      const relative = path.slice(root.length + 1);

      if (EXCLUDED_DIRECTORIES.some((excluded) => relative === excluded || relative.startsWith(`${excluded}/`))) {
        continue;
      }

      if (entry.isDirectory) {
        await walk(path);
      } else if (entry.isFile && path.endsWith(".ts")) {
        found.push(path);
      }
    }
  }

  await walk(root);
  return found;
}

/** A violation, printed the way `deno lint` prints one: a location, then the message. */
function printViolation(sourceFile: ts.SourceFile, ruleName: string, node: ts.Node, message: string): void {
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart(sourceFile));
  const relative = sourceFile.fileName.slice(ROOT.length + 1);

  console.error(`error[${ruleName}]: ${message}`);
  console.error(`  --> ${relative}:${line + 1}:${character + 1}`);
  console.error("");
}

async function main(): Promise<void> {
  const files = await collectFiles(ROOT);
  let problems = 0;

  for (const path of files) {
    const text = await Deno.readTextFile(path);
    const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

    for (const rule of RULES) {
      for (const violation of rule.check(sourceFile, path)) {
        printViolation(sourceFile, rule.name, violation.node, violation.message);
        problems += 1;
      }
    }
  }

  if (problems > 0) {
    console.error(`Found ${problems} problem${problems === 1 ? "" : "s"}`);
    Deno.exit(1);
  }

  console.log(`Checked ${files.length} files`);
}

if (import.meta.main) await main();
