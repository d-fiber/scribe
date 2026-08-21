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

/** The file whose presence makes a directory a package, and the only thing that says so. */
export const MANIFEST_FILE = "package.yaml";

/** The directory holding everything a package is made of. */
export const LIBRARY_DIRECTORY = "lib";

/** The directory holding the tests, which a package cannot be without. */
export const TESTS_DIRECTORY = "tests";

/** The directory, inside {@link TESTS_DIRECTORY}, holding what a consumer imports to stub this package. */
export const TESTING_DIRECTORY = "testing";

/** The directory holding the SQL played when the stack is built, when a package poses any. */
export const SQL_DIRECTORY = "db/init";

/** The directory holding the slices of the ops templates, when a package starts a container. */
export const OPS_DIRECTORY = "ops";

/** The directory holding the `.proto` files, when a package speaks to a worker. */
export const PROTOCOL_DIRECTORY = "protocol";

/**
 * The entry of the package called `name`, relative to the package.
 *
 * @remarks
 * It is derived and never declared. A package has one way in, it is named after the package, and
 * the layout says where it sits, so a manifest that could point somewhere else would only be a
 * chance for the two to disagree.
 */
export function entryOf(name: string): string {
  return `${LIBRARY_DIRECTORY}/${name}.ts`;
}
