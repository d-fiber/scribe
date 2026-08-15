// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
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
import type { Contribution } from "../routing/contribution.ts";
import type { DiscoveredRoute } from "../routing/discovery.ts";
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

    const routes: MountedRoute[] = nodes.flatMap((node) => [
      ...compileNode(node.name, node.layers, discovered),
    ]);

    return new WorkerDefinition({
      nodes: nodes.map((node) => ({
        name: node.name,
        public: node.public,
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
