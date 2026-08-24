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

import { SCOPE } from "../../scope.ts";

/** The file whose presence makes a directory a project, and the only thing that says so. */
export const MANIFEST_FILE = "project.yaml";

/** The directory holding everything a project is made of. */
export const LIBRARY_DIRECTORY = "lib";

/** The directory, inside {@link LIBRARY_DIRECTORY}, the served surface is read off. */
export const SOURCE_DIRECTORY = "src";

/** The directory the tools write everything they derive into. */
export const DERIVED_DIRECTORY = ".scribe";

/** The route table, inside {@link DERIVED_DIRECTORY}. */
export const ROUTES_FILE = "routes.ts";

/**
 * The specifier the worker SDK answers, which is what a generated route table names.
 *
 * @remarks
 * The table is read by the worker and by nothing else, so it names what the worker runs on. The
 * two shapes it declares have to be the very classes the worker's own `compileNode` tests against,
 * which is why this is the SDK rather than the language: a table typed against another copy of the
 * same vocabulary would compile and then mount nothing.
 */
export const WORKER_SDK: string = `${SCOPE}sdk`;

/** The tree the surface is read off, relative to the project. */
export const SOURCE_PATH: string = `${LIBRARY_DIRECTORY}/${SOURCE_DIRECTORY}`;

/**
 * The entry of the project called `name`, relative to the project.
 *
 * @remarks
 * It is derived and never declared, the way a package's is. A project has one way in, it is named
 * after the project, and the layout says where it sits, so a manifest that could point somewhere
 * else would only be a chance for the two to disagree.
 */
export function entryOf(name: string): string {
  return `${LIBRARY_DIRECTORY}/${name}.ts`;
}
