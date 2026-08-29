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
 * The workspace root, taken from where this plugin sits rather than from the process.
 *
 * The file is `<root>/.lint/sealed-runtime.ts`, so one directory up is the root. It is read once,
 * at load, and never per file: a rule runs for every file in the repository, and an environment
 * call there is both wasteful and, on some platforms, fatal.
 */
const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

/**
 * Whether `filename` is a test of a mountable package.
 *
 * A package is written against `Scribe` and `expect`, never against the runtime under them: the
 * whole point of `@scribe/alchemy/test` is to be the layer between the two. A test that reaches for
 * the runtime directly is a test that would not survive the framework changing hosts, and it is
 * the seam this rule keeps sealed.
 */
function isPackageTest(filename: string): boolean {
  const root = `${ROOT}/`;
  if (!filename.startsWith(root)) return false;

  const relative = filename.slice(root.length);
  return relative.startsWith("packages/") && relative.includes("/tests/");
}

/**
 * The specifier prefixes a package test may not import.
 *
 * `@std` and `jsr:@std` are the standard library, `node:` the Node compatibility surface, and
 * `npm:` a package pulled straight from the registry. Each of them is a dependency on the host
 * rather than on the framework, and every one of them has an answer inside `@scribe/alchemy/test`.
 */
const FORBIDDEN_SPECIFIERS = ["@std/", "jsr:@std/", "node:", "npm:"] as const;

/** The message a forbidden import reports with. */
function importMessage(specifier: string): string {
  return `"${specifier}" reaches past the framework to the runtime under it. A package test is ` +
    `written against @scribe/alchemy/test, which stands between the two on purpose: Scribe holds ` +
    `the cases, expect and its matchers hold the assertions, and the Memory doubles hold the ` +
    `ports. Nothing a package test needs is outside it.`;
}

export default {
  name: "sealed-runtime",
  rules: {
    "sealed-runtime": {
      create(ctx: Deno.lint.RuleContext) {
        if (!isPackageTest(ctx.filename)) return {};

        function checkSpecifier(node: Deno.lint.Node, specifier: string) {
          if (FORBIDDEN_SPECIFIERS.some((prefix) => specifier.startsWith(prefix))) {
            ctx.report({ node, message: importMessage(specifier) });
          }
        }

        return {
          ImportDeclaration(node) {
            checkSpecifier(node, (node.source as { value: string }).value);
          },
          ExportNamedDeclaration(node) {
            const source = node.source as { value: string } | null;
            if (source) checkSpecifier(node, source.value);
          },
          ExportAllDeclaration(node) {
            checkSpecifier(node, (node.source as { value: string }).value);
          },
          ImportExpression(node) {
            const argument = node.source as { type?: string; value?: unknown } | undefined;
            if (argument?.type === "Literal" && typeof argument.value === "string") {
              checkSpecifier(node, argument.value);
            }
          },
          MemberExpression(node) {
            const object = node.object as { type?: string; name?: string };
            if (object.type === "Identifier" && object.name === "Deno") {
              ctx.report({
                node,
                message: "Deno is the runtime the framework stands in front of. A package test " +
                  "declares its cases with Scribe, not Deno.test, and reads the clock, the file " +
                  "system and the rest through the doubles in @scribe/alchemy/test.",
              });
            }
          },
        };
      },
    },
  },
} satisfies Deno.lint.Plugin;
