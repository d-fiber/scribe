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

import type { Manifest } from "@scribe/alchemy";

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
