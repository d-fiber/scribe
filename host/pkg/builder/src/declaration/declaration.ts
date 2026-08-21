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

import type { Constraint } from "../version/constraint.ts";
import type { Version } from "../version/version.ts";

/** A step a package runs at one of the three moments of its life. */
export type LifecycleStep = () => void | Promise<void>;

/** What a package says about itself, and the whole of what its manifest holds. */
export interface Manifest {
  /** The name the package is mounted, imported and written into `config.yaml` under. */
  readonly name: string;

  /** What the package is for, in one sentence, as its manifest puts it. */
  readonly description: string;

  /** The version this copy of the package publishes. */
  readonly version: Version;

  /** The packages this one may import, each against the versions it accepts. */
  readonly dependencies: ReadonlyMap<string, Constraint>;
}

/** The directories a package poses on the machine, each relative to the package. */
export interface Provided {
  /** Where the SQL played when the stack is built lives, or null when the package ships none. */
  readonly sql: string | null;

  /** Where the slices of the ops templates live, or null when the package starts no container. */
  readonly ops: string | null;

  /** Where the `.proto` files live, or null when the package speaks to no worker. */
  readonly protocol: string | null;
}

/**
 * A package, as its manifest declares it and as its tree completes it.
 *
 * @remarks
 * Everything beyond the manifest is read off the directory rather than written down. A path that
 * has to be declared as well as laid out is a chance for the two to disagree, and the one that
 * loses is always the tree, since that is what actually runs.
 */
export interface Declaration extends Manifest {
  /** What the package poses on the machine, found by looking for it. */
  readonly provides: Provided;

  /**
   * The public surface, from the entry a consumer writes to the file it resolves to.
   *
   * @remarks
   * Every file sitting directly in `lib/` is an entry, and so is every file sitting directly in
   * `tests/testing/`. The one named after the package is the entry of its directory: `lib/x.ts` is
   * `.` and `tests/testing/x.ts` is `./testing`, while their neighbours take their own names.
   *
   * The generated import map carries these and nothing else, which is how `lib/src/` stays private
   * without a rule that says it should.
   */
  readonly exports: ReadonlyMap<string, string>;

  /**
   * The specifiers this package writes that belong to neither the framework nor itself.
   *
   * @remarks
   * They are read out of the sources, not declared: a package that imports a registry package has
   * already said so by importing it. What answers each of them is settled once for the whole
   * workspace, so no package carries a version of something it does not own.
   */
  readonly imports: ReadonlySet<string>;
}

/**
 * The three moments a package runs at, as its entry file exports them.
 *
 * @remarks
 * They are read off the module rather than declared in the manifest, because a manifest holds
 * values and these are functions. Each one is optional, and a package that exports none simply
 * never runs outside the calls its consumers make.
 */
export interface Lifecycle {
  /** What is wired as soon as the entry is imported, because it needs nothing to be running. */
  readonly wires?: LifecycleStep;

  /** What runs once the process can reach the database, after boot. */
  readonly starts?: LifecycleStep;

  /** What runs when the process is asked to stop. */
  readonly stops?: LifecycleStep;

  /**
   * Whatever else the entry exports, which is the package's own surface and none of this concern.
   *
   * @remarks
   * It is here because the three steps above are all optional, and TypeScript refuses a value that
   * shares no property with a type whose properties are all optional. Without this, a package whose
   * entry runs at no moment could not be handed over at all, which is most of them.
   */
  readonly [exported: string]: unknown;
}

/** A package the host has on hand, with the steps its entry offered. */
export interface MountedPackage {
  /** What the manifest declared. */
  readonly manifest: Manifest;

  /** What is wired at import, or null when the entry exports nothing for it. */
  readonly wires: LifecycleStep | null;

  /** What runs after boot, or null when the entry exports nothing for it. */
  readonly starts: LifecycleStep | null;

  /** What runs at shutdown, or null when the entry exports nothing for it. */
  readonly stops: LifecycleStep | null;
}

/**
 * The package `manifest` describes, with whichever steps `entry` happens to export.
 *
 * @remarks
 * This is what the generated registrations call, once per mounted package. Reading the steps here
 * rather than at each call site means a package that exports none and a package that exports all
 * three are handed to the host in the same shape.
 */
export function mount(manifest: Manifest, entry: Lifecycle): MountedPackage {
  return {
    manifest,
    wires: entry.wires ?? null,
    starts: entry.starts ?? null,
    stops: entry.stops ?? null,
  };
}
