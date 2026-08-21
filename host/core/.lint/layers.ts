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

const ALLOWED: Record<string, readonly string[]> = {
  contracts: [],
  // `runtime` and `packages` name each other on purpose. They are one layer cut
  // across two repositories: the cache, the queue, the cron and the hook sat in
  // `runtime/` until they moved to the mandatory package, and they still reach
  // back for the Redis connection and the async primitives. Ranking one above
  // the other would be inventing an order the code does not have.
  runtime: ["contracts", "packages"],
  packages: ["contracts", "runtime", "packages"],
  kernel: ["contracts", "runtime", "packages"],
  testing: ["contracts", "runtime", "packages", "kernel", "dependencies", "testing"],
  dependencies: ["contracts", "runtime", "packages", "dependencies"],
  boot: [
    "contracts",
    "runtime",
    "packages",
    "kernel",
    "testing",
    "dependencies",
    "boot",
  ],
  tests: [
    "contracts",
    "runtime",
    "packages",
    "kernel",
    "testing",
    "dependencies",
    "boot",
    "tests",
  ],
};

const HOST_CONSUMERS: readonly string[] = ["boot", "tests"];

const PACKAGE_MARKER = "/scribe/host/core/";
const FUNCTIONS_MARKER = "/scribe/host/";

const SPECIFIER_PREFIXES = ["@scribe/core/", "@scribe/host/"] as const;

/**
 * The packages, reached by their own name instead of through the host tree.
 *
 * Each one is a workspace package of its own, so its specifier carries no layer
 * segment to read. They are the `packages` layer wherever they appear, and a new
 * package has to be added here to be seen as one.
 */
const PACKAGE_PREFIXES = [
  "@scribe/audience/",
  "@scribe/auth/",
  "@scribe/dynamic_links/",
  "@scribe/foundation/",
  "@scribe/realtime/",
  "@scribe/remote_configs/",
  "@scribe/search/",
  "@scribe/storage/",
] as const;
const PACKAGE_LAYER = "packages";

function layerOfSpecifier(source: string): string | null {
  if (PACKAGE_PREFIXES.some((prefix) => source.startsWith(prefix))) {
    return PACKAGE_LAYER;
  }

  for (const prefix of SPECIFIER_PREFIXES) {
    if (!source.startsWith(prefix)) continue;
    const layer = source.slice(prefix.length).split("/")[0];
    return layer in ALLOWED ? layer : null;
  }
  return null;
}

const TESTS_SEGMENT = "/tests/";
const TESTING_SEGMENT = "/testing/";

function layerOfFile(filename: string): string | null {
  if (filename.includes(TESTS_SEGMENT)) return "tests";
  if (filename.includes(TESTING_SEGMENT)) return "testing";

  const packageAt = filename.indexOf(PACKAGE_MARKER);
  if (packageAt !== -1) {
    const layer = filename
      .slice(packageAt + PACKAGE_MARKER.length)
      .split("/")[0];
    return layer in ALLOWED ? layer : null;
  }

  const functionsAt = filename.indexOf(FUNCTIONS_MARKER);
  if (functionsAt === -1) return null;
  const layer = filename
    .slice(functionsAt + FUNCTIONS_MARKER.length)
    .split("/")[0];
  return layer in ALLOWED ? layer : null;
}

function isHostEntry(source: string): boolean {
  return source === "@scribe/core/host.ts";
}

// `@scribe/foundation` is deliberately absent. The mandatory package is named,
// not a path into the host tree, so `core` reaching it is not core reaching the
// host: what stays forbidden here is the modules a project chooses, which the
// package must keep standing without.
const HOST_PREFIXES = ["@scribe/host/", "@app/"] as const;

function isHostSpecifier(source: string): boolean {
  return HOST_PREFIXES.some((prefix) => source.startsWith(prefix));
}

export default {
  name: "layers",
  rules: {
    layers: {
      create(ctx: Deno.lint.RuleContext) {
        const from = layerOfFile(ctx.filename);
        if (from === null) return {};
        const allowed = ALLOWED[from];
        const insidePackage = ctx.filename.includes(PACKAGE_MARKER);

        function check(node: Deno.lint.Node, source: string) {
          if (insidePackage && isHostSpecifier(source)) {
            ctx.report({
              node,
              message: `core cannot import "${source}": the package must stand alone, ` +
                `without the host's modules. Declare a port in contracts/ and let the host wire it.`,
            });
            return;
          }

          if (isHostEntry(source) && !HOST_CONSUMERS.includes(from!)) {
            ctx.report({
              node,
              message: `"${from}/" cannot import "@scribe/core/host.ts": the host entry point is reserved for ` +
                `${HOST_CONSUMERS.join(", ")}. Import "@scribe/core/mod.ts" instead.`,
            });
            return;
          }

          const to = layerOfSpecifier(source);
          if (to === null || to === from) return;

          if (!allowed.includes(to)) {
            ctx.report({
              node,
              message: `"${from}/" cannot import "${to}/": that import goes back up the layers. ` +
                `${from}/ may only depend on ${allowed.join(", ") || "nothing"}.`,
            });
          }
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
