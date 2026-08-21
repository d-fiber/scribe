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
 * The primitives a package is written with.
 *
 * @remarks
 * A package declares itself in a `package.yaml` at its root, and that file is the only thing that
 * makes a directory a package. What this module holds is the other half: the shape that manifest is
 * read into, the steps an entry file may export, and the rules that refuse a name or a version
 * whichever form it arrived in.
 *
 * Nothing here reads a file or reaches outside the process. That is the point of keeping it apart
 * from `@scribe/builder/tools`: a package carries this half into every project that mounts it, so
 * it drags no toolchain behind it.
 *
 * @example
 * ```ts
 * // lib/realtime.ts, the one way into the package.
 * export { Realtime } from "./src/channel.ts";
 *
 * export function starts(): Promise<void> {
 *   return syncDeclaredChannels();
 * }
 * ```
 */

export { DeclarationError, Package } from "./src/declaration/builder.ts";
export type {
  AwaitingDependencies,
  AwaitingDescription,
  AwaitingVersion,
  Buildable,
  Dependencies,
} from "./src/declaration/builder.ts";

export { mount } from "./src/declaration/declaration.ts";
export type { Lifecycle, LifecycleStep, Manifest, MountedPackage } from "./src/declaration/declaration.ts";

export { BuilderError } from "./src/errors.ts";

export { Constraint } from "./src/version/constraint.ts";
export { Version, VersionError } from "./src/version/version.ts";
