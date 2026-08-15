// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
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
