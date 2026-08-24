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

/** The extension every file of the tree carries. */
export const SOURCE_EXTENSION = ".ts";

/**
 * What a name starts with when the framework owns it rather than the URL.
 *
 * @remarks
 * It is what keeps `_middleware.ts` and `_logs.ts` off the served surface without a list of
 * exceptions, and it is why a project may put its own helpers next to the routes that use them: a
 * name under this prefix answers no path, whether the framework knows it or not.
 */
export const RESERVED_PREFIX = "_";

/** The file that answers the path of the directory holding it, rather than a path of its own. */
export const INDEX_NAME = "index";

/** The file that wraps every route under the directory holding it. */
export const MIDDLEWARE_FILE: string = `${RESERVED_PREFIX}middleware${SOURCE_EXTENSION}`;

/**
 * The file a node hands its own entries to.
 *
 * @remarks
 * Two places are read and no others: the root of `lib/`, whose sink takes what no node claimed, and
 * the root of a node, whose sink takes that node's. A node that writes none receives nothing, and
 * nothing is passed up to its parent.
 */
export const LOGS_FILE: string = `${RESERVED_PREFIX}logs${SOURCE_EXTENSION}`;

/** The name a sink used to go by, kept to recognise it and say where it went. */
export const RETIRED_LOGS_FILE: string = `${RESERVED_PREFIX}log${SOURCE_EXTENSION}`;

/** The name a node's declaration used to go by, kept to recognise it and refuse it. */
export const RETIRED_NODE_FILE: string = `${RESERVED_PREFIX}node${SOURCE_EXTENSION}`;

/** Whether `basename` is a file the scan reads at all. */
export function isSource(basename: string): boolean {
  return basename.endsWith(SOURCE_EXTENSION);
}

/** Whether `basename` is kept off the served surface by its leading underscore. */
export function isReserved(basename: string): boolean {
  return basename.startsWith(RESERVED_PREFIX);
}

/** Whether `basename` answers a path of its own. */
export function isRoutable(basename: string): boolean {
  return isSource(basename) && !isReserved(basename);
}

/** `basename` without the extension every file of the tree carries. */
export function withoutExtension(basename: string): string {
  return basename.slice(0, -SOURCE_EXTENSION.length);
}

/**
 * `name` as the router spells it, `[id]` becoming `:id`.
 *
 * @remarks
 * Brackets are how the tree writes a parameter and a colon is how the router reads one, because
 * Windows refuses a colon in a file name. A file and a directory are written the same way, so
 * `[id].ts` and `[id]/` both name one, and anything else comes back untouched.
 */
export function segmentOf(name: string): string {
  const parameter = name.startsWith("[") && name.endsWith("]");
  return parameter ? `:${name.slice(1, -1)}` : name;
}

/**
 * The path `name` answers, under the path `prefix` answers.
 *
 * @remarks
 * The root is `/`, so joining onto it must not leave `//` behind.
 */
export function pathUnder(prefix: string, name: string): string {
  const segment = segmentOf(name);
  return prefix === "/" ? `/${segment}` : `${prefix}/${segment}`;
}
