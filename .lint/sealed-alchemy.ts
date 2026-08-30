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

import { forEachIdentifierNamed, forEachModuleSpecifier, type Rule, type Violation } from "./ast.ts";

/**
 * The workspace root, taken from where this rule sits rather than from the process.
 *
 * The file is `<root>/.lint/sealed-alchemy.ts`, so one directory up is the root. It is read
 * once, at load, and never per file: a rule runs for every file in the repository, and an
 * environment call there is both wasteful and, on some platforms, fatal.
 */
const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

/**
 * The specifier prefixes `alchemy/` may not import.
 *
 * `alchemy/deno.json` declares an empty import map, `{}`, so a bare specifier already fails to
 * resolve. `node:`, `npm:` and `jsr:` are not bare: Deno resolves them on their own, with no map
 * entry needed, so the empty map does not stop one from working. This is the check that does.
 */
const FORBIDDEN_SPECIFIERS = ["@std/", "jsr:@std/", "node:", "npm:"] as const;

/** Whether `filename` sits under `alchemy/`. */
function isAlchemyFile(filename: string): boolean {
  const root = `${ROOT}/`;
  if (!filename.startsWith(root)) return false;

  return filename.slice(root.length).startsWith("alchemy/");
}

export const sealedAlchemy: Rule = {
  name: "sealed-alchemy",

  check(sourceFile, filename) {
    if (!isAlchemyFile(filename)) return [];

    const violations: Violation[] = [];

    forEachModuleSpecifier(sourceFile, ({ node, specifier }) => {
      if (FORBIDDEN_SPECIFIERS.some((prefix) => specifier.startsWith(prefix))) {
        violations.push({
          node,
          message: `"${specifier}" reaches past the language to a runtime or a registry. ` +
            `alchemy/ is the vocabulary every package and every engine layer is written ` +
            `against, and it imports nothing outside itself, so that reaching it never gives a ` +
            `capability. A vocabulary that depended on a host would stop being one.`,
        });
      }
    });

    forEachIdentifierNamed(sourceFile, "Deno", (node) => {
      violations.push({
        node,
        message: "This names the host runtime directly. alchemy/ imports nothing outside " +
          "itself and runs nowhere on its own, so nothing here ever has a host to name. " +
          "engine/runtime/scholium/ is where a host is named, and alchemy/ is not part of it.",
      });
    });

    return violations;
  },
};
