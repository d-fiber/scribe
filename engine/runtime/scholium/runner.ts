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

import { Runners, type TestRunner } from "@scribe/alchemy/test";

import { currentStack } from "@scribe/runtime/scholium/host.ts";
import { TestWrapperRunner as DenoRunner } from "@scribe/runtime/scholium/deno/runner.ts";

/**
 * The {@link TestRunner} this stack hands every case declared through `Scribe` to, or null when
 * this stack has none yet.
 *
 * @remarks
 * A file that only imports this module for its install-on-import effect, without ever declaring a
 * case through `Scribe`, must not fail just for being loaded on a stack that has no runner: the
 * failure that matters is `Scribe.test` reaching an unfilled {@link Runners}, which already reports
 * clearly on its own, not this function refusing on its behalf.
 */
function localRunner(): TestRunner | null {
  switch (currentStack()) {
    case "deno":
      return new DenoRunner();
    case "node":
    case "bun":
      return null;
  }
}

/**
 * Fills {@link Runners} with this stack's runner, unless something already filled it or this
 * stack has none yet.
 *
 * @remarks
 * It runs on import, because `Scribe` reads the slot the moment a case is declared and a test file
 * declares its cases as it is read. The guard leaves a suite that wired its own runner alone.
 */
export function installRunner(): void {
  if (Runners.configured) return;

  const runner = localRunner();
  if (runner) Runners.use(runner);
}

installRunner();
