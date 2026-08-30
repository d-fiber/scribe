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

import { log } from "../observability/logger.ts";
import { SinkRegistry } from "../observability/sink_registry.ts";
import type { WorkerCron, WorkerHook, WorkerQueue, WorkerRealtime, WorkerSearcher, WorkerStorage } from "./events.ts";
import { cronIdOf, hookIdOf, queueIdOf } from "./events.ts";
import { routeIdOf, routingKeyOf, type WorkerRoute } from "./route.ts";

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export interface NodeManifest {
  /** The node's name, the one a route or a log sink declares itself under. */
  readonly name: string;

  /** Whether this node is reachable directly, rather than only through another node's dispatch. */
  readonly public: boolean;

  /** Whether this node carries its own `_logs.ts`, rather than falling to the default sink. */
  readonly logSink: boolean;
}

export interface MountedRoute {
  /** The node this route was mounted under. */
  readonly node: string;

  /** The route's identifier, unique across the whole worker. */
  readonly routeId: string;

  /** The route itself, as it was declared. */
  readonly route: WorkerRoute;
}

export interface WorkerInput {
  /** The nodes this worker declares. None when omitted. */
  readonly nodes?: readonly NodeManifest[];

  /** The routes this worker mounts. None when omitted. */
  readonly routes?: readonly MountedRoute[];

  /** The queues this worker declares. None when omitted. */
  readonly queues?: readonly WorkerQueue<never>[];

  /** The hooks this worker declares. None when omitted. */
  readonly hooks?: readonly WorkerHook[];

  /** The cron jobs this worker declares. None when omitted. */
  readonly crons?: readonly WorkerCron[];

  /** The searchers this worker declares. None when omitted. */
  readonly searchers?: readonly WorkerSearcher[];

  /** The realtime channels this worker declares. None when omitted. */
  readonly realtimes?: readonly WorkerRealtime[];

  /** The storage folders this worker declares. None when omitted. */
  readonly storages?: readonly WorkerStorage[];

  /** Where this worker's log sinks are registered. A fresh, empty registry when omitted. */
  readonly sinks?: SinkRegistry;
}

export class WorkerDefinition {
  /** The nodes this worker declares. */
  readonly nodes: readonly NodeManifest[];

  /** The routes this worker mounts. */
  readonly routes: readonly MountedRoute[];

  /** This worker's queues, indexed by the identifier {@link queueIdOf} derives from their name. */
  readonly queues: ReadonlyMap<string, WorkerQueue<never>>;

  /** This worker's hooks, indexed by the identifier {@link hookIdOf} derives from their event and ordinal. */
  readonly hooks: ReadonlyMap<string, WorkerHook>;

  /** This worker's cron jobs, indexed by the identifier {@link cronIdOf} derives from their name. */
  readonly crons: ReadonlyMap<string, WorkerCron>;

  /** The searchers this worker declares. */
  readonly searchers: readonly WorkerSearcher[];

  /** The realtime channels this worker declares. */
  readonly realtimes: readonly WorkerRealtime[];

  /** The storage folders this worker declares. */
  readonly storages: readonly WorkerStorage[];

  /** Where this worker's log sinks are registered. */
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
    if (index.has(id)) {
      throw new ManifestError(`Two ${label}s share the identifier ${id}.`);
    }
    index.set(id, item);
  });
  return index;
}
