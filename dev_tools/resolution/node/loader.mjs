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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const importsJsonUrl = new URL("../../../scribe.imports.json", import.meta.url);
const repoRoot = new URL("../../../", import.meta.url);
const { imports } = JSON.parse(readFileSync(importsJsonUrl, "utf8"));

const specifierMap = new Map();
for (const [specifier, target] of Object.entries(imports)) {
  if (target.startsWith("npm:") || target.startsWith("jsr:")) continue;
  specifierMap.set(specifier, new URL(target, repoRoot).href);
}

function longestPrefix(specifier) {
  let found;
  for (const candidate of specifierMap.keys()) {
    if (!candidate.endsWith("/") || !specifier.startsWith(candidate)) continue;
    if (!found || candidate.length > found.length) found = candidate;
  }
  return found;
}

export function resolve(specifier, context, nextResolve) {
  const exact = specifierMap.get(specifier);
  if (exact) return { url: exact, shortCircuit: true };

  const prefix = longestPrefix(specifier);
  if (prefix) {
    const rest = specifier.slice(prefix.length);
    return { url: new URL(rest, specifierMap.get(prefix)).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const esbuild = await import("esbuild");
    const source = readFileSync(fileURLToPath(url), "utf8");
    const { code } = esbuild.transformSync(source, {
      loader: "ts",
      format: "esm",
    });
    return { format: "module", source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
