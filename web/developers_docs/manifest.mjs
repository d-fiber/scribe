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

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT =
  process.env.PROJECT_ROOT ?? path.resolve(HERE, "../../..");

export const GENERATED_DOCS = path.join(
  PROJECT_ROOT,
  `.${path.basename(PROJECT_ROOT)}/docs`,
);

export const ASSETS_ROOT = path.join(PROJECT_ROOT, "assets");

/// Les assets que le projet doit fournir. Le portail n'en embarque aucun : il
/// est le framework, la marque appartient au projet.
export const REQUIRED_ASSETS = ["logo-light.png", "logo-dark.png"];

export function requireAssets() {
  const missing = REQUIRED_ASSETS.filter(
    (name) => !fs.existsSync(path.join(ASSETS_ROOT, name)),
  );
  if (missing.length > 0) {
    throw new Error(
      `${ASSETS_ROOT} is missing ${missing.join(", ")} — the project must provide them (see assets/README.md).`,
    );
  }
  return REQUIRED_ASSETS.map((name) => path.join(ASSETS_ROOT, name));
}

export const LANDING_MODE = "landing";

export function readManifest() {
  const file = path.join(GENERATED_DOCS, "index.json");
  if (!fs.existsSync(file)) {
    throw new Error(
      `${file} is missing run \`gen docs\` before building the portal.`,
    );
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function buildModes() {
  return [
    ...readManifest().surfaces.map((surface) => surface.key),
    LANDING_MODE,
  ];
}
