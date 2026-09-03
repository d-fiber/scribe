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

import type { Future } from "../async/future.ts";
import type { Constraint } from "./constraint.ts";
import type { Version } from "./version.ts";

/** A step a package runs at one of the three moments of its life. */
export type LifecycleStep = () => void | Future<void>;

/**
 * One way a manifest may say where a dependency comes from.
 *
 * @remarks
 * A `"sdk"` source is the ordinary one, a package this checkout already carries at a version the
 * constraint accepts, the same idea as a `pubspec.yaml` writing `sdk: flutter` for a package the
 * Flutter SDK ships. A `"path"` and a `"git"` source name a copy the checkout never pinned, and
 * neither carries a constraint: what they name is trusted as it is, the way a `path:` or a `git:`
 * dependency of a `pubspec.yaml` is.
 */
export type DependencySource =
  | Readonly<{ kind: "sdk"; constraint: Constraint }>
  | Readonly<{ kind: "path"; path: string }>
  | Readonly<{ kind: "git"; url: string; ref: string | null; path: string | null }>;

/** What a package says about itself, and the whole of what its manifest holds. */
export interface Manifest {
  /** The name the package is mounted, imported and written into `config.yaml` under. */
  readonly name: string;

  /** What the package is for, in one sentence, as its manifest puts it. */
  readonly description: string;

  /** The version this copy of the package publishes. */
  readonly version: Version;

  /**
   * The framework versions this package accepts, as its manifest wrote them.
   *
   * @remarks
   * It is what the package says it was written against, checked before anything resolves. Without
   * it a package would take whichever checkout is on hand and fail at type check, where nothing
   * points back at the version that caused it.
   */
  readonly scribe: Constraint;

  /**
   * The packages this one may import, each from where its manifest said it comes.
   *
   * @remarks
   * It is a frozen record rather than a map because a manifest that came out of
   * {@link Package.build} must not be writable, and `Object.freeze` does not reach inside a map:
   * a `ReadonlyMap` refuses a write to whoever reads the type and accepts one from whoever asserts
   * past it, which is every tool that normalises a manifest on the way to a lock file.
   */
  readonly dependencies: Readonly<Record<string, DependencySource>>;
}

/**
 * The three moments a package runs at, as its entry file exports them.
 *
 * @remarks
 * They are functions rather than values, which is why they are read off the module instead of being
 * declared in the manifest. Each one is optional, and a package that offers none simply never runs
 * outside the calls its consumers make.
 */
export interface LifecycleSteps {
  /** What is wired as soon as the entry is imported, because it needs nothing to be running. */
  readonly wires?: LifecycleStep;

  /** What runs once the process can reach the database, after boot. */
  readonly starts?: LifecycleStep;

  /** What runs when the process is asked to stop. */
  readonly stops?: LifecycleStep;
}

/**
 * What a package entry exports so the host knows when to run it.
 *
 * @remarks
 * The steps sit under a member of their own, and the member is required, so a package that runs at
 * no moment says so with an empty one rather than by exporting nothing. That is what buys the
 * check: an entry whose steps are misspelt shares no property with {@link LifecycleSteps} and is
 * refused where it is written. Reading the three names off the module itself could not do that,
 * because a module exports whatever it likes and `start` instead of `starts` read as one more
 * export of the package's own surface.
 *
 * @example
 * ```ts ignore
 * export const scribe: LifecycleSteps = {
 *   starts: () => Audiences.use(new RedisAudiences(url)),
 * };
 * ```
 */
export interface Lifecycle {
  /** When this package runs, and empty when it runs at none of the three moments. */
  readonly scribe: LifecycleSteps;
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
    wires: entry.scribe.wires ?? null,
    starts: entry.scribe.starts ?? null,
    stops: entry.scribe.stops ?? null,
  };
}
