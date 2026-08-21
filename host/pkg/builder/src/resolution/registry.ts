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

import type { Constraint } from "@scribe/alchemy";
import type { Version } from "@scribe/alchemy";
import type { DiscoveredPackage } from "../workspace/discovery.ts";

/** Where resolution learns which versions of a package exist, and what each of them asks for. */
export interface Registry {
  /** Whether a package called `name` exists at all. */
  knows(name: string): boolean;

  /** Every version of `name` that can be mounted, in no particular order. */
  versionsOf(name: string): readonly Version[];

  /** What `name` at `version` asks for, from a package name to the constraint it accepts. */
  dependenciesOf(
    name: string,
    version: Version,
  ): ReadonlyMap<string, Constraint>;
}

/**
 * The packages of a checkout, each in the single version its working tree holds.
 *
 * @remarks
 * A checkout has one copy of a package and therefore one version of it, so resolution against this
 * registry never picks between two: what it still does is prove that the versions on disk answer
 * the constraints written against them, which is the check that catches a package bumped without
 * its dependents.
 */
export class WorkspaceRegistry implements Registry {
  readonly #packages: Map<string, DiscoveredPackage>;

  constructor(packages: readonly DiscoveredPackage[]) {
    this.#packages = new Map(
      packages.map((found) => [found.declaration.name, found]),
    );
  }

  knows(name: string): boolean {
    return this.#packages.has(name);
  }

  versionsOf(name: string): readonly Version[] {
    const found = this.#packages.get(name);
    return found === undefined ? [] : [found.declaration.version];
  }

  dependenciesOf(
    name: string,
    _version: Version,
  ): ReadonlyMap<string, Constraint> {
    return this.#packages.get(name)?.declaration.dependencies ?? new Map();
  }
}
