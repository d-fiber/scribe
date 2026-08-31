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
 * Imports `@generated/di.ts` once, so every `@Singleton` class a project wrote registers itself
 * before anything resolves it.
 *
 * @remarks
 * A class marked `@Singleton` puts itself in the shared container the moment its module is
 * imported, so there is nothing to call and nothing to order once that import has happened: this
 * is the whole of what wiring a project's own services takes. It plays the same role for a
 * project's own services that `mountedPackages` in `../packages/mounted.ts` plays for the
 * framework's own packages, one file simpler, because a package's `wires` step still has to run
 * at the right moment while a `@Singleton` class only has to exist.
 *
 * A project with no `@Singleton` class writes an empty `di.ts`, and a project `forge` was never
 * run against writes none at all: the second is read the same as the first, since a worker has to
 * start whether or not its project uses the container.
 */

import type { Future } from "@scribe/alchemy";
import { isMissingModule } from "../extensions/missing_module.ts";

let loaded: Future<void> | null = null;

/**
 * Imports `@generated/di.ts` for its effect, once per process.
 *
 * @throws When the generated file exists and threw while loading; a project that mounts services
 * this badly is a fault worth stopping the worker over, not one to start silently without.
 */
export function wireGeneratedSingletons(): Future<void> {
  loaded ??= import("@generated/di.ts")
    .then(() => undefined)
    .catch((raised: unknown) => {
      if (isMissingModule(raised)) return;
      console.error("[di] @generated/di.ts threw while loading:", raised);
      throw raised;
    });

  return loaded;
}
