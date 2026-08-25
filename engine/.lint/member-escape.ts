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

/**
 * The two directories a workspace member sits directly under, from the workspace root.
 *
 * They are matched as a prefix of the path relative to the root, never as a substring: a
 * generated stub written to `sdk/js/gen/scribe/engine/packages/<name>/` carries both words in
 * its path and belongs to no member, and searching anywhere in the string would take it for one.
 *
 * The anchor is the root itself and not the checkout's name, which is the whole difference from
 * the layer rule this replaces. Cloning the repository under any name leaves `engine/` and
 * `packages/` exactly where they are.
 */
const MEMBER_ROOTS = ["engine/", "packages/"] as const;

/** The member `filename` belongs to, as an absolute directory, or null when it is in none. */
function memberOf(filename: string): string | null {
  const root = `${Deno.cwd()}/`;
  if (!filename.startsWith(root)) return null;

  const relative = filename.slice(root.length);
  for (const under of MEMBER_ROOTS) {
    if (!relative.startsWith(under)) continue;

    const name = relative.slice(under.length).split("/")[0];
    if (name === "" || !relative.slice(under.length).includes("/")) continue;

    return `${root}${under}${name}/`;
  }
  return null;
}

/** Where `specifier` lands, read from the directory `filename` sits in. */
function resolvedFrom(filename: string, specifier: string): string {
  const segments = filename.split("/").slice(0, -1);
  for (const step of specifier.split("/")) {
    if (step === "." || step === "") continue;
    if (step === "..") segments.pop();
    else segments.push(step);
  }
  return segments.join("/");
}

export default {
  name: "member-escape",
  rules: {
    "member-escape": {
      create(ctx: Deno.lint.RuleContext) {
        const home: string | null = memberOf(ctx.filename);
        if (home === null) return {};
        const within = home;

        function check(node: Deno.lint.Node, specifier: string) {
          if (!specifier.startsWith(".")) return;
          if (resolvedFrom(ctx.filename, specifier).startsWith(within)) return;

          ctx.report({
            node,
            message: `"${specifier}" climbs out of this member. A file of another member is ` +
              `reached by the specifier its own deno.json declares, so that deno check refuses ` +
              `what the layer order forbids. A path walks around that check.`,
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
            check(node, (node.source as { value: string }).value);
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
