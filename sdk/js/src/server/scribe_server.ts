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

import type {
  WorkerCron,
  WorkerHook,
  WorkerQueue,
  WorkerRealtime,
  WorkerSearcher,
  WorkerStorage,
} from "../manifest/events.ts";
import { type MountedRoute, WorkerDefinition } from "../manifest/worker.ts";
import { SinkRegistry } from "../observability/sink_registry.ts";
import type { Contribution } from "../routing/contribution.ts";
import type { DiscoveredLogSink, DiscoveredRoute } from "../routing/discovery.ts";
import { compileNode, RoutingError } from "../routing/tree.ts";
import { env } from "../runtime/env.ts";
import { serveWorker, workerHandler } from "../runtime/serve.ts";
import type { Node } from "./node.ts";

const PORT_SETTING = "WORKER_PORT";

const DEFAULT_PORT = 8888;

interface ResolvedNode {
  readonly name: string;
  readonly public: boolean;
  readonly layers: readonly Contribution[];
}

export interface ServerOptions {
  readonly port?: number;
  readonly hostname?: string;
  readonly routes?: readonly DiscoveredRoute[];
  readonly nodes?: readonly string[];
  readonly logSinks?: readonly DiscoveredLogSink[];
  readonly queues?: readonly WorkerQueue<never>[];
  readonly hooks?: readonly WorkerHook[];
  readonly crons?: readonly WorkerCron[];
  readonly searchers?: readonly WorkerSearcher[];
  readonly realtimes?: readonly WorkerRealtime[];
  readonly storages?: readonly WorkerStorage[];
}

export class ScribeServer {
  readonly #options: ServerOptions;
  readonly #nodes: ResolvedNode[] = [];

  constructor(options: ServerOptions = {}) {
    this.#options = options;
  }

  addNode(node: Node): this {
    if (this.#nodes.some((declared) => declared.name === node.name)) {
      throw new RoutingError(
        `The node "${node.name}" is declared twice on the server.`,
      );
    }
    this.#nodes.push({
      name: node.name,
      public: node.public,
      layers: node.layers(),
    });
    return this;
  }

  definition(): WorkerDefinition {
    const discovered = this.#options.routes ?? [];
    const nodes = this.#nodes;
    this.#rejectMissingFolders();
    this.#rejectUndeclaredRoutes(discovered);

    const sinks = new SinkRegistry(this.#options.logSinks ?? []);
    this.#rejectUndeclaredSinks(sinks);

    const routes: MountedRoute[] = nodes.flatMap((node) => [
      ...compileNode(node.name, node.layers, discovered),
    ]);

    return new WorkerDefinition({
      sinks,
      nodes: nodes.map((node) => ({
        name: node.name,
        public: node.public,
        logSink: sinks.hasNode(node.name),
      })),
      routes,
      queues: this.#options.queues,
      hooks: this.#options.hooks,
      crons: this.#options.crons,
      searchers: this.#options.searchers,
      realtimes: this.#options.realtimes,
      storages: this.#options.storages,
    });
  }

  handler(): (request: Request) => Promise<Response> {
    return workerHandler(this.definition());
  }

  run(signal?: AbortSignal): Promise<void> {
    const definition = this.definition();
    const port = this.#options.port ?? env.number(PORT_SETTING, DEFAULT_PORT);

    console.log(
      `[worker] ${definition.routes.length} routes on ${definition.nodes
        .map((node) => `${node.name}${node.public ? "" : " (internal)"}`)
        .join(", ")}`,
    );

    return serveWorker(definition, {
      port,
      hostname: this.#options.hostname,
      signal,
    });
  }

  #rejectUndeclaredRoutes(discovered: readonly DiscoveredRoute[]): void {
    const declared = new Set(this.#nodes.map((node) => node.name));

    for (const route of discovered) {
      if (declared.has(route.node)) continue;

      throw new RoutingError(
        `${route.file} lives under "${route.node}/", which no addNode() declares: ` +
          `nothing is served until the server opts in.`,
      );
    }
  }

  /**
   * Refuses a `_log.ts` under a folder no `addNode()` opens.
   *
   * Without this the file is read, the class is built, and nothing is ever
   * delivered to it: the host only ever names nodes the manifest declares. The
   * failure would be a sink that stays silent, which is indistinguishable from
   * a sink that has nothing to report.
   */
  #rejectUndeclaredSinks(sinks: SinkRegistry): void {
    const declared = new Set(this.#nodes.map((node) => node.name));

    for (const node of sinks.nodes()) {
      if (declared.has(node)) continue;

      throw new RoutingError(
        `A _log.ts lives under "${node}/", which no addNode() declares: ` +
          `nothing would ever be delivered to it.`,
      );
    }
  }

  #rejectMissingFolders(): void {
    const folders = this.#options.nodes;
    if (folders === undefined) return;

    for (const node of this.#nodes) {
      if (folders.includes(node.name)) continue;

      throw new RoutingError(
        `addNode() declares "${node.name}", but no ${node.name}/ folder exists under the source root: ` +
          `a node is named after the folder it serves.`,
      );
    }
  }
}
