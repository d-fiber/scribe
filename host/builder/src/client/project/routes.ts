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

import { dirname, join } from "@std/path";
import type { ProjectApi, ScannedRoute, ScannedSink } from "./api.ts";
import { WORKER_SDK } from "./layout.ts";
import { specifierFrom } from "../../paths.ts";

/** What the route table is asked to describe, and where the file that describes it goes. */
export interface RoutesEmission {
  /** The surface the scan read off the tree. */
  readonly api: ProjectApi;
  /** The absolute path of the project the paths in {@link api} are written relative to. */
  readonly root: string;
  /** The absolute path of the file the table is written to. */
  readonly at: string;
}

/**
 * The source of the file the worker reads its surface off.
 *
 * @remarks
 * A tree cannot be walked at startup in every language the framework means to serve. Dart compiled
 * ahead of time has neither reflection nor a dynamic import, so discovery has to produce source
 * that a compiler swallows, and the same mechanism then works everywhere rather than in Deno only.
 *
 * Nothing here parses TypeScript. Each file arrives as an `import * as`, and which of its exports
 * is an endpoint, a middleware or a sink is settled when the node is compiled.
 *
 * A file named twice is bound once: a route and its middleware often name the same module, and a
 * second import of it would not compile.
 */
export function routesSource(emitted: RoutesEmission): string {
  const bound = new Bindings(dirname(emitted.at), emitted.root);
  const routes = emitted.api.routes.map((route) => entryOfRoute(route, bound));
  const sinks = emitted.api.sinks.map((sink) => entryOfSink(sink, bound));
  const nodes = emitted.api.nodes.map((node) => JSON.stringify(node)).join(", ");

  return [
    `import type { DiscoveredLogSink, DiscoveredRoute } from ${JSON.stringify(WORKER_SDK)};`,
    ...bound.imports,
    "",
    "/** Every directory of `lib/src/`, whether or not it holds a route yet. */",
    `export const nodes: readonly string[] = [${nodes}];`,
    "",
    "/** Every path the project answers, with the middleware each one runs. */",
    "export const routes: readonly DiscoveredRoute[] = [",
    ...routes,
    "];",
    "",
    "/** Where a node's entries go, the sink taking what no node claimed carrying a null node. */",
    "export const logSinks: readonly DiscoveredLogSink[] = [",
    ...sinks,
    "];",
    "",
  ].join("\n");
}

/** Writes the route table to the file {@link RoutesEmission.at} names, creating the directory it sits in. */
export async function writeRoutes(emitted: RoutesEmission): Promise<void> {
  await Deno.mkdir(dirname(emitted.at), { recursive: true });
  await Deno.writeTextFile(emitted.at, routesSource(emitted));
}

class Bindings {
  readonly #from: string;
  readonly #root: string;
  readonly #names = new Map<string, string>();
  readonly #written: string[] = [];

  constructor(from: string, root: string) {
    this.#from = from;
    this.#root = root;
  }

  /** The import lines every binding taken so far needs, in the order they were taken. */
  get imports(): readonly string[] {
    return this.#written;
  }

  /** The name `file` is bound to, taking one under `prefix` the first time it is asked for. */
  take(file: string, prefix: string): string {
    const held = this.#names.get(file);
    if (held !== undefined) return held;

    const name = `_${prefix}${this.#names.size}`;
    this.#names.set(file, name);
    this.#written.push(
      `import * as ${name} from ${JSON.stringify(specifierFrom(this.#from, join(this.#root, file)))};`,
    );
    return name;
  }
}

function entryOfRoute(route: ScannedRoute, bound: Bindings): string {
  const module = bound.take(route.file, "r");
  const branches = route.branches.map((file) => bound.take(file, "b")).join(", ");
  const fields = [
    `node: ${JSON.stringify(route.node)}`,
    `path: ${JSON.stringify(route.path)}`,
    `file: ${JSON.stringify(route.file)}`,
    `module: ${module}`,
    `branches: [${branches}]`,
  ];
  return `  { ${fields.join(", ")} },`;
}

function entryOfSink(sink: ScannedSink, bound: Bindings): string {
  const node = sink.node === null ? "null" : JSON.stringify(sink.node);
  return `  { node: ${node}, file: ${JSON.stringify(sink.file)}, module: ${bound.take(sink.file, "l")} },`;
}
