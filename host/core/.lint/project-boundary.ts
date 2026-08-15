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

const SDK_MARKER = "/scribe/";

const PROJECT_PREFIXES = ["@app/", "@generated/"] as const;

const SEAM_HINT =
  'wrap it in `try { await import("…") } catch` with a defined fallback, ' +
  "the way the other seams do";

function projectPrefixOf(source: string): string | null {
  for (const prefix of PROJECT_PREFIXES) {
    if (source.startsWith(prefix)) return prefix;
  }
  return null;
}

export default {
  name: "project-boundary",
  rules: {
    "project-boundary": {
      create(ctx: Deno.lint.RuleContext) {
        if (!ctx.filename.includes(SDK_MARKER)) return {};

        function check(node: Deno.lint.Node, source: string) {
          if (projectPrefixOf(source) === null) return;

          ctx.report({
            node,
            message:
              `the SDK cannot statically import "${source}": scribe/ must compile, ` +
              `test and boot without the project. To reach the project anyway, ${SEAM_HINT}.`,
          });
        }

        return {
          ImportDeclaration(node) {
            check(node, (node.source as { value: string }).value);
          },
          ExportNamedDeclaration(node) {
            const source = node.source as { value: string } | null;
            if (source) check(node, source.value);
          },
          ExportAllDeclaration(node) {
            const source = node.source as { value: string } | null;
            if (source) check(node, source.value);
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
