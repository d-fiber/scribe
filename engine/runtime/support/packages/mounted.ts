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
 * What a project mounted, written down before anything runs.
 *
 * @remarks
 * `scribe gen code` reads the packages a project names and writes one entry per package into
 * `@generated/registrations.ts`, in the order the manifest lists them. Nothing is searched for
 * here: by the time this is read the list is a literal in a file on disk.
 *
 * The order matters and is the project's. A package that fills a port checks whether it is already
 * filled, so the first one to answer wins, and a project that puts its own package ahead of a
 * shipped one gets its own driver.
 */

import type { Future, LifecycleSteps } from "@scribe/alchemy";
import { isMissingModule } from "../extensions/missing_module.ts";

/** One package a project mounted, and the three moments it may run at. */
export interface MountedPackage {
  /** The name the project wrote in its manifest, used only to say which package a failure came from. */
  readonly name: string;

  /** The lifecycle its entry exports, which may hold none of the three steps. */
  readonly steps: LifecycleSteps;
}

/** What `@generated/registrations.ts` exports, one entry per package a project mounts. */
export interface Registrations {
  /** The packages, in the order the project's manifest names them. */
  readonly mounted: readonly MountedPackage[];
}

let loaded: Future<readonly MountedPackage[]> | null = null;

/**
 * The packages this process mounts, read once.
 *
 * @remarks
 * A process with no project on the other side has no generated file, and answers an empty list
 * rather than refusing: the framework has to compile and boot with nothing mounted. A file that is
 * there and throws is raised, because swallowing it would leave every port a package fills unbound
 * with nothing said, which reads as a healthy start followed by an unexplained exit.
 */
export function mountedPackages(): Future<readonly MountedPackage[]> {
  loaded ??= import("@generated/registrations.ts")
    .then((module) => (module as unknown as Registrations).mounted ?? [])
    .catch((raised: unknown) => {
      if (isMissingModule(raised)) return [];
      console.error("[packages] @generated/registrations.ts threw while loading:", raised);
      throw raised;
    });

  return loaded;
}

/**
 * Runs one moment of every mounted package, in the order the project named them.
 *
 * @remarks
 * A step that throws stops the run and is raised with the package it came from, because a package
 * that could not wire itself has left ports unbound and the process would die later on a path that
 * says nothing about the cause.
 *
 * They run one after another rather than together: a package may fill a port another one reads at
 * its own moment, and the project's order is what decides who wins.
 */
export async function runMounted(moment: keyof LifecycleSteps): Future<void> {
  for (const mounted of await mountedPackages()) {
    const step = mounted.steps[moment];
    if (!step) continue;

    try {
      await step();
    } catch (raised) {
      console.error(`[packages] ${mounted.name} threw at ${moment}.`, raised);
      throw raised;
    }
  }
}
