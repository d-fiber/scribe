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
 * What reads a project and writes the surface it serves.
 *
 * @remarks
 * A project declares itself in `project.yaml` and holds what it is made of under `lib/`, the same
 * two rules a package follows. What it has on top is a served surface: the tree under `lib/src/` is
 * the router, one directory per node, one file per path.
 *
 * This half touches the file system and is never carried into a running project. `./tools` is the
 * other half, which reads the packages a project mounts.
 */

export {
  INDEX_NAME,
  isReserved,
  isRoutable,
  isSource,
  LOGS_FILE,
  MIDDLEWARE_FILE,
  pathUnder,
  RESERVED_PREFIX,
  RETIRED_LOGS_FILE,
  RETIRED_NODE_FILE,
  segmentOf,
  SOURCE_EXTENSION,
  withoutExtension,
} from "./src/client/project/conventions.ts";
export {
  DERIVED_DIRECTORY,
  entryOf,
  LIBRARY_DIRECTORY,
  MANIFEST_FILE,
  ROUTES_FILE,
  SOURCE_DIRECTORY,
  SOURCE_PATH,
  WORKER_SDK,
} from "./src/client/project/layout.ts";
export { ApiError, scanApi } from "./src/client/project/api.ts";
export type { ProjectApi, ScannedRoute, ScannedSink } from "./src/client/project/api.ts";
export { routesSource, writeRoutes } from "./src/client/project/routes.ts";
export type { RoutesEmission } from "./src/client/project/routes.ts";
