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

import type { DiscoveredLogSink } from "../routing/discovery.ts";
import { instances } from "../routing/instances.ts";
import { LogSink } from "./log_sink.ts";

/** The key the root sink is filed under, which no node name can collide with. */
const ROOT = "";

/**
 * The sinks a project declared, indexed by the node they take entries for.
 *
 * The fallback is the whole design: an entry goes to its node's sink, and to
 * the root sink when the node declared none. A project with neither is a
 * project that never asked for its logs, and the host keeps shipping them.
 */
export class SinkRegistry {
  readonly #sinks = new Map<string, LogSink>();

  constructor(discovered: readonly DiscoveredLogSink[] = []) {
    for (const sink of discovered) {
      for (const instance of instances<LogSink>(sink.module, LogSink)) {
        this.#sinks.set(sink.node ?? ROOT, instance);
      }
    }
  }

  /** Whether `node` declared a sink of its own. */
  hasNode(node: string): boolean {
    return this.#sinks.has(node);
  }

  /** Whether the project declared a root sink. */
  get hasRoot(): boolean {
    return this.#sinks.has(ROOT);
  }

  /** Every node that declared a sink. */
  nodes(): readonly string[] {
    return [...this.#sinks.keys()].filter((key) => key !== ROOT);
  }

  /**
   * The sink that takes an entry of `node`, or `null` when nothing does.
   *
   * `null` for the node means an entry that belongs to none, which only the
   * root sink can take.
   */
  resolve(node: string | null): LogSink | null {
    if (node !== null) {
      const own = this.#sinks.get(node);
      if (own) return own;
    }

    return this.#sinks.get(ROOT) ?? null;
  }
}
