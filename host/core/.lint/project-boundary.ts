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
