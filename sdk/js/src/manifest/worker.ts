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

import { log } from "../observability/logger.ts";
import { SinkRegistry } from "../observability/sink_registry.ts";
import type {
  WorkerCron,
  WorkerHook,
  WorkerQueue,
  WorkerRealtime,
  WorkerSearcher,
  WorkerStorage,
} from "./events.ts";
import { cronIdOf, hookIdOf, queueIdOf } from "./events.ts";
import { routeIdOf, routingKeyOf, type WorkerRoute } from "./route.ts";

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export interface NodeManifest {
  readonly name: string;
  readonly public: boolean;
  readonly logSink: boolean;
}

export interface MountedRoute {
  readonly node: string;
  readonly routeId: string;
  readonly route: WorkerRoute;
}

export interface WorkerInput {
  readonly nodes?: readonly NodeManifest[];
  readonly routes?: readonly MountedRoute[];
  readonly queues?: readonly WorkerQueue<never>[];
  readonly hooks?: readonly WorkerHook[];
  readonly crons?: readonly WorkerCron[];
  readonly searchers?: readonly WorkerSearcher[];
  readonly realtimes?: readonly WorkerRealtime[];
  readonly storages?: readonly WorkerStorage[];
  readonly sinks?: SinkRegistry;
}

export class WorkerDefinition {
  readonly nodes: readonly NodeManifest[];
  readonly routes: readonly MountedRoute[];
  readonly queues: ReadonlyMap<string, WorkerQueue<never>>;
  readonly hooks: ReadonlyMap<string, WorkerHook>;
  readonly crons: ReadonlyMap<string, WorkerCron>;
  readonly searchers: readonly WorkerSearcher[];
  readonly realtimes: readonly WorkerRealtime[];
  readonly storages: readonly WorkerStorage[];
  readonly sinks: SinkRegistry;

  readonly #byRouteId: Map<string, MountedRoute>;

  constructor(input: WorkerInput) {
    this.nodes = input.nodes ?? [];
    this.routes = input.routes ?? [];
    this.queues = indexed(input.queues ?? [], queueIdOf, "queue");
    this.hooks = indexed(input.hooks ?? [], hookIdOf, "hook");
    this.crons = indexed(input.crons ?? [], cronIdOf, "cron");
    this.searchers = input.searchers ?? [];
    this.realtimes = input.realtimes ?? [];
    this.storages = input.storages ?? [];
    this.sinks = input.sinks ?? new SinkRegistry();
    log.useSinks(this.sinks);

    this.#byRouteId = new Map(
      this.routes.map((entry) => [entry.routeId, entry]),
    );
    this.#rejectUndeclaredNodes();
    this.#rejectAmbiguousRoutes();
  }

  routeFor(routeId: string): MountedRoute | null {
    return this.#byRouteId.get(routeId) ?? null;
  }

  queueFor(queueId: string): WorkerQueue<never> | null {
    return this.queues.get(queueId) ?? null;
  }

  hookFor(hookId: string): WorkerHook | null {
    return this.hooks.get(hookId) ?? null;
  }

  cronFor(cronId: string): WorkerCron | null {
    return this.crons.get(cronId) ?? null;
  }

  #rejectUndeclaredNodes(): void {
    const declared = new Set(this.nodes.map((node) => node.name));
    for (const entry of this.routes) {
      if (!declared.has(entry.node)) {
        throw new ManifestError(
          `${entry.routeId} belongs to the node "${entry.node}", which is not declared on the server.`,
        );
      }
    }
  }

  #rejectAmbiguousRoutes(): void {
    if (this.#byRouteId.size !== this.routes.length) {
      throw new ManifestError(
        `Two routes share the same identifier: ${this.#duplicateRouteId()}.`,
      );
    }

    const routing = new Map<string, string>();
    for (const entry of this.routes) {
      const key = routingKeyOf(entry.node, entry.route);
      const previous = routing.get(key);
      if (previous) {
        throw new ManifestError(
          `${entry.routeId} and ${previous} collide once path parameters are ignored.`,
        );
      }
      routing.set(key, entry.routeId);
    }
  }

  #duplicateRouteId(): string {
    const seen = new Set<string>();
    for (const entry of this.routes) {
      if (seen.has(entry.routeId)) return entry.routeId;
      seen.add(entry.routeId);
    }
    return "";
  }
}

export function mountedRoute(node: string, route: WorkerRoute): MountedRoute {
  return { node, routeId: routeIdOf(node, route), route };
}

function indexed<T>(
  items: readonly T[],
  identify: (item: T, ordinal: number) => string,
  label: string,
): ReadonlyMap<string, T> {
  const index = new Map<string, T>();
  items.forEach((item, ordinal) => {
    const id = identify(item, ordinal);
    if (index.has(id))
      throw new ManifestError(`Two ${label}s share the identifier ${id}.`);
    index.set(id, item);
  });
  return index;
}
