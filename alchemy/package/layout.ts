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

import { ARTEFACTS_KEY } from "./artefacts.ts";
import type { UnmodifiableList } from "../value/list.ts";

/** The file that makes a directory a package, and the only one it cannot do without. */
export const MANIFEST = "package.yaml";

/** The six keys a manifest holds, and there is no seventh. */
export const MANIFEST_KEYS: UnmodifiableList<string> = [
  "name",
  "description",
  "version",
  "environment",
  "dependencies",
  ARTEFACTS_KEY,
];

/**
 * A directory a package customarily carries, and what it means when it does.
 *
 * @remarks
 * It describes the shape most packages settle on, and it decides nothing. What a package is made of
 * is read off its tree; what it hands the stack is declared under `scribe:`, where the keys are
 * ours and the paths are the package's, so a package may name these directories anything and put
 * them anywhere inside itself.
 */
export interface PackageDirectory {
  /** What the directory is called, at the root of the package. */
  readonly name: string;

  /** What being there means. */
  readonly holds: string;

  /** Whether a package without it is still a package. Every one of them is optional but `lib`. */
  readonly required: boolean;
}

/**
 * What a directory has to hold to be a package, and what it customarily holds besides.
 *
 * @remarks
 * Only `lib` is load-bearing. The rest is the layout a reader expects to find, not a list anything
 * is looked up in: a package that puts its migrations somewhere of its own invention declares that
 * place under `scribe:` and they run, and a package that puts them in `deploy/db/` without declaring
 * them finds that nothing runs them.
 */
export const PACKAGE_LAYOUT: UnmodifiableList<PackageDirectory> = [
  { name: "lib", holds: "the surface a project imports, and the code behind it", required: true },
  {
    name: "deploy",
    holds: "everything the stack reads: the SQL, the compose fragments, the recipes, the configuration",
    required: false,
  },
  { name: "protocol", holds: "the contract between the host and a worker, one file per capability", required: false },
  { name: "tests", holds: "what proves the package does what it says", required: false },
  { name: "examples", holds: "the ten lines somebody reads before the documentation", required: false },
];

/** Whether `name` is a directory the package layout knows about. */
export function isPackageDirectory(name: string): boolean {
  return PACKAGE_LAYOUT.some((directory) => directory.name === name);
}

/** What a package cannot be without: the manifest, and `lib`. */
export function requiredEntries(): UnmodifiableList<string> {
  return [MANIFEST, ...PACKAGE_LAYOUT.filter((one) => one.required).map((one) => one.name)];
}
