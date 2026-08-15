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
