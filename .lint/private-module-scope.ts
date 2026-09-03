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

import { forEachModuleSpecifier, namedSpecifiersOf, type Rule, sourceNameOf, type Violation } from "./ast.ts";

/** Whether a specifier's directory, relative to the file that wrote it, stays inside its own tree. */
function isAllowedDir(dir: string): boolean {
  if (dir === "" || dir === ".") return true;
  return dir.split("/").every((segment) => segment === "..");
}

export const privateModuleScope: Rule = {
  name: "private-module-scope",

  check(sourceFile) {
    const violations: Violation[] = [];

    forEachModuleSpecifier(sourceFile, ({ node, specifier }) => {
      if (!specifier.startsWith(".")) return;

      const segments = specifier.split("/");
      const name = segments[segments.length - 1];
      const dir = segments.slice(0, -1).join("/");
      if (isAllowedDir(dir)) return;

      if (name.startsWith("_")) {
        violations.push({
          node,
          message: `"${name}" is a private module (starts with _) and can only be imported ` +
            `from its own directory or any of its subdirectories.`,
        });
      }

      for (const specifierNode of namedSpecifiersOf(node)) {
        const privateName = sourceNameOf(specifierNode);
        if (!privateName.startsWith("_")) continue;

        violations.push({
          node: specifierNode,
          message: `"${privateName}" starts with _ and is private to its directory it cannot ` +
            `be used outside of its folder or its descendants.`,
        });
      }
    });

    return violations;
  },
};
