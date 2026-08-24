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

import { join, relative } from "@std/path";
import { ScribeError } from "@scribe/alchemy";
import {
  INDEX_NAME,
  isReserved,
  isRoutable,
  LOGS_FILE,
  MIDDLEWARE_FILE,
  pathUnder,
  RETIRED_LOGS_FILE,
  RETIRED_NODE_FILE,
  withoutExtension,
} from "./conventions.ts";
import { LIBRARY_DIRECTORY, SOURCE_DIRECTORY, SOURCE_PATH } from "./layout.ts";

/** Raised when the tree under `lib/src/` cannot become a surface the worker can serve. */
export class ApiError extends ScribeError {}

/** A route file the scan found, and where it answers. */
export interface ScannedRoute {
  /** The node it answers for, which is the directory of `lib/src/` it sits under. */
  readonly node: string;
  /** The path it answers, with `:name` for each parameter. */
  readonly path: string;
  /** Where it sits, relative to the project, with forward slashes. */
  readonly file: string;
  /** Every middleware between the root of the node and this route, root first. */
  readonly branches: readonly string[];
}

/** A `_logs.ts` the scan found, and what it takes the entries of. */
export interface ScannedSink {
  /** The node it takes the entries of, or null for the one that takes what no node claimed. */
  readonly node: string | null;
  /** Where it sits, relative to the project, with forward slashes. */
  readonly file: string;
}

/** The surface a project serves, as its tree spells it. */
export interface ProjectApi {
  /** The nodes found, sorted, which is one name per directory of `lib/src/`. */
  readonly nodes: readonly string[];
  /** The routes found, in the order the walk met them, so the table moves only when the tree does. */
  readonly routes: readonly ScannedRoute[];
  /** The sinks found, the root one first, then one per node in the order the nodes come. */
  readonly sinks: readonly ScannedSink[];
}

interface Walk {
  readonly node: string;
  readonly prefix: string;
  readonly branches: readonly string[];
  readonly atRootOfNode: boolean;
}

interface Found {
  readonly routes: ScannedRoute[];
  readonly sinks: ScannedSink[];
}

/**
 * The surface the project in `directory` serves, read off `lib/src/`.
 *
 * @remarks
 * A directory of `lib/src/` is a node, a file under it is a path, and a name in brackets is a
 * parameter whether it is written on a file or on a directory. A name starting with `_` answers no
 * path: two of them are read anyway, `_middleware.ts`, which wraps everything under the directory
 * holding it, and `_logs.ts`, which takes a node's entries.
 *
 * Nothing here reads TypeScript. What a file exported is decided when the node is compiled, which
 * is the one place the information really exists; a scan that guessed at it from the text would be
 * wrong on a comment or a string and would look right until a call arrived.
 *
 * @throws {ApiError} When there is no `lib/src/`, when a file and a directory claim one path, or
 * when a reserved file sits somewhere nothing would ever reach it.
 */
export async function scanApi(directory: string): Promise<ProjectApi> {
  const source = join(directory, LIBRARY_DIRECTORY, SOURCE_DIRECTORY);
  if (!(await isDirectory(source))) {
    throw new ApiError(
      `${directory} has no ${SOURCE_PATH}/, so it serves nothing. A node is a directory of it, ` +
        `and a file under that node is a path.`,
    );
  }

  const nodes = await nodesOf(source);
  const found: Found = { routes: [], sinks: [] };

  if (await isFile(join(directory, LIBRARY_DIRECTORY, LOGS_FILE))) {
    found.sinks.push({ node: null, file: `${LIBRARY_DIRECTORY}/${LOGS_FILE}` });
  }
  await refuseStrayFiles(source);

  for (const node of nodes) {
    await walk(join(source, node), directory, found, {
      node,
      prefix: "/",
      branches: [],
      atRootOfNode: true,
    });
  }

  return { nodes, routes: found.routes, sinks: found.sinks };
}

async function nodesOf(source: string): Promise<string[]> {
  const nodes: string[] = [];
  for await (const entry of Deno.readDir(source)) {
    if (entry.isDirectory && !isReserved(entry.name)) nodes.push(entry.name);
  }
  return nodes.sort();
}

/**
 * Refuses a file of `lib/src/` that sits above every node.
 *
 * @remarks
 * A path answers for one node and a node is a directory, so a file here reaches nothing. Ignoring
 * it would be worse than refusing it: the author sees a file they wrote and a surface that never
 * mentions it, with nothing saying which of the two is wrong.
 */
async function refuseStrayFiles(source: string): Promise<void> {
  for (const name of await sortedNames(source, (entry) => entry.isFile)) {
    const where = `${SOURCE_PATH}/${name}`;
    if (name === LOGS_FILE) {
      throw new ApiError(
        `${where} takes the entries of no node. A sink sits at ${LIBRARY_DIRECTORY}/${LOGS_FILE}, ` +
          `which takes what no node claimed, or at ${SOURCE_PATH}/<node>/${LOGS_FILE}.`,
      );
    }
    if (name === MIDDLEWARE_FILE) {
      throw new ApiError(
        `${where} wraps nothing. A middleware belongs to a node: put it at ` +
          `${SOURCE_PATH}/<node>/${MIDDLEWARE_FILE}, and every route of that node runs it.`,
      );
    }
    if (isRoutable(name)) {
      throw new ApiError(
        `${where} answers for no node, so nothing serves it. Move it under ` +
          `${SOURCE_PATH}/<node>/, since a path always answers for one node.`,
      );
    }
  }
}

async function walk(directory: string, root: string, found: Found, walking: Walk): Promise<void> {
  const files = await sortedNames(directory, (entry) => entry.isFile);
  const directories = await sortedNames(directory, (entry) => entry.isDirectory);

  refuseRetired(files, directory, root, walking);
  collectSink(files, directory, root, found, walking);

  const branches = inherit(files, directory, root, walking);
  collectRoutes(files, directories, directory, root, found, { ...walking, branches });

  for (const name of directories) {
    if (isReserved(name)) continue;
    await walk(join(directory, name), root, found, {
      node: walking.node,
      prefix: pathUnder(walking.prefix, name),
      branches,
      atRootOfNode: false,
    });
  }
}

/**
 * Refuses the two reserved names the tree no longer carries.
 *
 * @remarks
 * Both were read once and are read no more, so leaving them alone would let a file that used to
 * decide something sit there deciding nothing, which reads as though it still did.
 */
function refuseRetired(files: readonly string[], directory: string, root: string, walking: Walk): void {
  if (files.includes(RETIRED_NODE_FILE)) {
    throw new ApiError(
      `${within(root, join(directory, RETIRED_NODE_FILE))} is obsolete: "${walking.node}/" carries ` +
        `its caller by name now. Delete it, and move what it declared to ${MIDDLEWARE_FILE}.`,
    );
  }
  if (files.includes(RETIRED_LOGS_FILE)) {
    throw new ApiError(
      `${within(root, join(directory, RETIRED_LOGS_FILE))} is obsolete: a sink is called ` +
        `${LOGS_FILE} now. Rename it.`,
    );
  }
}

/**
 * Records this directory's `_logs.ts`, and refuses one that sits below a node's root.
 *
 * @remarks
 * The host routes by node and knows nothing finer, so a sink deeper than a node would be built and
 * handed nothing. That silence is indistinguishable from a sink with nothing to report, which is
 * why it is a refusal rather than something the scan passes over.
 */
function collectSink(
  files: readonly string[],
  directory: string,
  root: string,
  found: Found,
  walking: Walk,
): void {
  if (!files.includes(LOGS_FILE)) return;

  const file = within(root, join(directory, LOGS_FILE));
  if (!walking.atRootOfNode) {
    throw new ApiError(
      `${file} would be handed nothing: the host routes by node, so a sink sits at ` +
        `${SOURCE_PATH}/${walking.node}/${LOGS_FILE} or at ${LIBRARY_DIRECTORY}/${LOGS_FILE}, ` +
        `and nowhere between.`,
    );
  }

  found.sinks.push({ node: walking.node, file });
}

/**
 * The branches a route under this directory carries, this directory's own middleware last.
 *
 * @remarks
 * Middleware accumulates downwards: a route runs every one between the node and itself, outermost
 * first, which is the order this list keeps.
 */
function inherit(files: readonly string[], directory: string, root: string, walking: Walk): string[] {
  if (!files.includes(MIDDLEWARE_FILE)) return [...walking.branches];
  return [...walking.branches, within(root, join(directory, MIDDLEWARE_FILE))];
}

/**
 * Adds one route per routable file of this directory.
 *
 * @remarks
 * A file named `index` answers the directory's own path rather than a path of its own, which is
 * also why it is the one name a sibling directory may repeat: `index.ts` claims the path its
 * parent already answers, so an `index/` beside it claims something else entirely.
 *
 * @throws {ApiError} When a file and a directory of the same name would answer one path, which the
 * tree cannot express.
 */
function collectRoutes(
  files: readonly string[],
  directories: readonly string[],
  directory: string,
  root: string,
  found: Found,
  walking: Walk,
): void {
  for (const basename of files) {
    if (!isRoutable(basename)) continue;

    const name = withoutExtension(basename);
    const file = within(root, join(directory, basename));
    if (name === INDEX_NAME) {
      found.routes.push({ node: walking.node, path: walking.prefix, file, branches: walking.branches });
      continue;
    }

    if (directories.includes(name)) {
      throw new ApiError(
        `${file} and ${within(root, join(directory, name))}/ both claim ` +
          `${pathUnder(walking.prefix, name)}: keep one of the two.`,
      );
    }

    const path = pathUnder(walking.prefix, name);
    found.routes.push({ node: walking.node, path, file, branches: walking.branches });
  }
}

async function sortedNames(
  directory: string,
  keep: (entry: Deno.DirEntry) => boolean,
): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (keep(entry)) names.push(entry.name);
  }
  return names.sort();
}

function within(root: string, path: string): string {
  return relative(root, path).replaceAll("\\", "/");
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isDirectory;
  } catch {
    return false;
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}
