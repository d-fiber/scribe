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
