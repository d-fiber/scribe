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

import { forEachModuleSpecifier, type Rule, type Violation } from "./ast.ts";
import { LAYER_SPECIFIERS } from "./engine_layers.generated.ts";

/**
 * The workspace root, taken from where this rule sits rather than from the process.
 *
 * The file is `<root>/.lint/engine-layers.ts`, so one directory up is the root. It is read once,
 * at load, and never per file, for the same reason `member-escape.ts` reads it once: a rule runs
 * for every file in the repository, and an environment call there is both wasteful and, on some
 * platforms, fatal.
 */
const ROOT = new URL("../", import.meta.url).pathname.replace(/\/$/, "");

/** The layer `filename` sits in, as one of the keys of {@link LAYER_SPECIFIERS}, or null outside all five. */
function layerOf(filename: string): string | null {
  const root = `${ROOT}/`;
  if (!filename.startsWith(root)) return null;

  const relative = filename.slice(root.length);
  for (const layer of Object.keys(LAYER_SPECIFIERS)) {
    if (relative.startsWith(layer)) return layer;
  }

  return null;
}

/**
 * Whether `allowed` clears `specifier`, matching the way an import map itself resolves a
 * specifier: an entry ending in `/` matches by prefix, and any other entry matches only whole.
 *
 * @remarks
 * `@scribe/foundation` and `@scribe/foundation/cache` are two different entries in the map this
 * rule reads, not one general `@scribe/foundation/` prefix, because the framework's own `imports`
 * never declared that general form either: a layer that may read `foundation/cache` was never
 * handed the rest of the package by the same line. Matching on prefix alone here would grant more
 * than the `deno.json` this rule replaced ever did.
 */
function clears(allowed: readonly string[], specifier: string): boolean {
  return allowed.some((entry) => entry.endsWith("/") ? specifier.startsWith(entry) : specifier === entry);
}

export const engineLayers: Rule = {
  name: "engine-layers",

  check(sourceFile, filename) {
    const layer = layerOf(filename);
    if (layer === null) return [];

    const allowed = LAYER_SPECIFIERS[layer];
    const violations: Violation[] = [];

    forEachModuleSpecifier(sourceFile, ({ node, specifier }) => {
      if (!specifier.startsWith("@scribe/")) return;
      if (clears(allowed, specifier)) return;

      violations.push({
        node,
        message: `"${specifier}" reaches past what ${layer} may see. The engine keeps a one-way ` +
          `order, runtime under kernel under embedder under shell, contracts under all four, and ` +
          `this specifier belongs to a layer above this file or one this file was never handed. ` +
          `Deno's own resolution no longer refuses this, now that every layer shares one import ` +
          `map, so this rule is what still does.`,
      });
    });

    return violations;
  },
};
