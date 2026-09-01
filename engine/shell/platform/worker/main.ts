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

import "../../common/settings.ts";

import { ScribeServer } from "@scribe/sdk";
import type { DeclaredNode, DiscoveredLogSink, DiscoveredRoute } from "@scribe/sdk";
import { wireGeneratedSingletons } from "@scribe/runtime/support/di/loaded.ts";

/** What `@generated/routes.ts` exports, which is the whole of what a project serves. */
interface GeneratedRoutes {
  /** The nodes the project's manifest arms, with what each one lets in. */
  readonly nodes: readonly DeclaredNode[];

  /** Every route found under the directory a node is served by. */
  readonly routes: readonly DiscoveredRoute[];

  /** The log sinks the project declared, if it declared any. */
  readonly logSinks?: readonly DiscoveredLogSink[];
}

/**
 * Runs the project this worker was given, and nothing else.
 *
 * It is the framework's own entry point and not the project's: what used to be
 * a `main.ts` every project copied is the same few lines everywhere, and the
 * nodes it used to declare are read from `config.yaml` now. The import is
 * dynamic because `@generated/` is resolved by the project's import map and not
 * by the framework's, so a static one would be checked against a map that never
 * carries it.
 *
 * The DI wire runs first: a node's own code may resolve a `@Singleton` the
 * moment it answers a call, and nothing here waits for a node to run before
 * that becomes possible.
 */
await wireGeneratedSingletons();

const generated = await import("@generated/routes.ts") as unknown as GeneratedRoutes;

await new ScribeServer({
  routes: generated.routes,
  nodes: generated.nodes,
  logSinks: generated.logSinks,
}).run();
