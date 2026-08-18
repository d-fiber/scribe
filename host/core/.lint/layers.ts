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
  "@scribe/foundation/",
  "@scribe/realtime/",
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
              message:
                `core cannot import "${source}": the package must stand alone, ` +
                `without the host's modules. Declare a port in contracts/ and let the host wire it.`,
            });
            return;
          }

          if (isHostEntry(source) && !HOST_CONSUMERS.includes(from!)) {
            ctx.report({
              node,
              message:
                `"${from}/" cannot import "@scribe/core/host.ts": the host entry point is reserved for ` +
                `${HOST_CONSUMERS.join(", ")}. Import "@scribe/core/mod.ts" instead.`,
            });
            return;
          }

          const to = layerOfSpecifier(source);
          if (to === null || to === from) return;

          if (!allowed.includes(to)) {
            ctx.report({
              node,
              message:
                `"${from}/" cannot import "${to}/": that import goes back up the layers. ` +
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
