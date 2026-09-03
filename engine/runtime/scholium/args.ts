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

import { currentStack } from "@scribe/runtime/scholium/host.ts";
import { processArgs as bunArgs } from "@scribe/runtime/scholium/bun/args.ts";
import { processArgs as denoArgs } from "@scribe/runtime/scholium/deno/args.ts";

/**
 * This process's own arguments, the ones after the script itself.
 *
 * @remarks
 * Picked by {@link currentStack} at the call, not once at import: unlike `env.ts`'s fallback,
 * nothing here can be overridden by a host that fills a slot, so there is nothing to cache — a
 * script reads this once, at its own start, to learn what it was told to do.
 *
 * There is no `node` case: nothing under `engine/` runs bare under `node`, only under `deno` or
 * `bun`, so a process that reaches this on `node` is one `currentStack` itself could not place,
 * and the refusal names that rather than guessing an answer.
 *
 * @throws {Error} When {@link currentStack} answers `node`.
 */
export function processArgs(): readonly string[] {
  switch (currentStack()) {
    case "deno":
      return denoArgs();
    case "bun":
      return bunArgs();
    case "node":
      throw new Error(`No process-argument reader ships for the "${currentStack()}" stack.`);
  }
}
