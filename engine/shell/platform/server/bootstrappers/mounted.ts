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

import type { Future } from "@scribe/alchemy";
import { runMounted } from "@scribe/runtime/support/packages/mounted.ts";
import type { Bootstrapper } from "../../../common/bootstrapper.ts";

/**
 * Runs the packages a project mounted, at the two moments a long-lived process has.
 *
 * @remarks
 * It is listed by the runtimes that keep running, and by no others. `starts` is where a package
 * puts the work that outlives a request, a cron loop or a queue consumer, and a process that only
 * dispatches has no business holding either.
 *
 * The engine used to name each of those loops itself, one bootstrapper per subsystem of one
 * package, so mounting a package was not enough to bring what it needs and unmounting one left a
 * dangling import. Here the engine decides when, and never what.
 */
export class MountedPackagesBootstrapper implements Bootstrapper {
  /** This bootstrapper's label in `BootSequence` logging: `packages`. */
  readonly name = "packages";

  boot(): Future<void> {
    return runMounted("starts");
  }

  shutdown(): Future<void> {
    return runMounted("stops");
  }
}
