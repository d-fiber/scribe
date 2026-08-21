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
 * What reads packages, resolves them and writes what the rest of the toolchain obeys.
 *
 * @remarks
 * This half touches the file system and is never carried into a running project. A package declares
 * itself in `package.yaml`; whoever builds a project calls {@link emit} to find those manifests,
 * settle the versions and write the map, the resolution, the registrations and the lock.
 *
 * There is no command line here. `scribedev` is the one the framework is maintained with, and
 * writing a package and reading what is wrong with one are its `pkg create` and `pkg check`.
 */

export type { Declaration, Provided } from "./src/declaration/discovered.ts";
export { chainOf, ManifestError, manifestFrom, manifestSource } from "./src/declaration/manifest.ts";

export { discover, DiscoveryError, loadDeclaration } from "./src/workspace/discovery.ts";
export type { DiscoveredPackage } from "./src/workspace/discovery.ts";
export { detectExports, detectProvided } from "./src/workspace/detect.ts";
export { outsideOf } from "./src/workspace/imports.ts";
export {
  entryOf,
  LIBRARY_DIRECTORY,
  MANIFEST_FILE,
  OPS_DIRECTORY,
  PROTOCOL_DIRECTORY,
  SQL_DIRECTORY,
  TESTING_DIRECTORY,
  TESTS_DIRECTORY,
} from "./src/workspace/layout.ts";
export { LANGUAGE, SCOPE } from "./src/workspace/scope.ts";

export { WorkspaceRegistry } from "./src/resolution/registry.ts";
export type { Registry } from "./src/resolution/registry.ts";
export { ResolutionError, resolve } from "./src/resolution/solver.ts";
export type { Resolution, ResolvedPackage } from "./src/resolution/solver.ts";

export { importMapFor, writeImportMap } from "./src/emit/import_map.ts";
export type { Consumer, ImportMap, ImportMapOptions } from "./src/emit/import_map.ts";
export { resolutionDocument, writeResolution } from "./src/emit/resolution.ts";
export type { EmittedPackage, ResolutionDocument } from "./src/emit/resolution.ts";
export { emit } from "./src/emit/emit.ts";
export type { Emission } from "./src/emit/emit.ts";
export { EmissionError, registrationsSource, writeRegistrations } from "./src/emit/registrations.ts";
export { lockText, writeLock } from "./src/emit/lock.ts";
