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

export default {
  name: "private-module-scope",
  rules: {
    "private-module-scope": {
      create(ctx: Deno.lint.RuleContext) {
        function isAllowedDir(dir: string): boolean {
          if (dir === "" || dir === ".") return true;
          return dir.split("/").every((s) => s === "..");
        }

        function check(node: Deno.lint.Node, source: string) {
          if (!source.startsWith(".")) return;

          const segments = source.split("/");
          const filename = segments[segments.length - 1];

          if (!filename.startsWith("_")) return;

          const dir = segments.slice(0, -1).join("/");
          if (!isAllowedDir(dir)) {
            ctx.report({
              node,
              message: `"${filename}" is a private module (starts with _) and can only be imported from its own directory or any of its subdirectories.`,
            });
          }
        }
        function checkPrivateIdentifiers(
          _: Deno.lint.Node,
          source: string,
          specifiers: Deno.lint.Node[],
        ) {
          if (!source.startsWith(".")) return;

          const segments = source.split("/");
          const dir = segments.slice(0, -1).join("/");
          if (isAllowedDir(dir)) return;

          for (const specifier of specifiers) {
            let privateName: string | undefined;

            if (specifier.type === "ImportSpecifier") {
              privateName = (specifier.imported as { name: string }).name;
            } else if (specifier.type === "ExportSpecifier") {
              privateName = (specifier.local as { name: string }).name;
            }

            if (privateName?.startsWith("_")) {
              ctx.report({
                node: specifier,
                message: `"${privateName}" starts with _ and is private to its directory it cannot be used outside of its folder or its descendants.`,
              });
            }
          }
        }

        return {
          ImportDeclaration(node) {
            const source = (node.source as { value: string }).value;
            check(node, source);
            checkPrivateIdentifiers(
              node,
              source,
              node.specifiers as Deno.lint.Node[],
            );
          },
          ExportAllDeclaration(node) {
            if (node.source) {
              check(node, (node.source as { value: string }).value);
            }
          },
          ExportNamedDeclaration(node) {
            if (node.source) {
              const source = (node.source as { value: string }).value;
              check(node, source);
              checkPrivateIdentifiers(
                node,
                source,
                node.specifiers as Deno.lint.Node[],
              );
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
