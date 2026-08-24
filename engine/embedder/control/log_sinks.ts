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

import { create } from "@bufbuild/protobuf";
import type { LoggedEntry } from "@scribe/alchemy/observe";
import type { LogRouting } from "@scribe/core/contracts/logging.ts";
import { firstSegmentOf } from "@scribe/core/runtime/http/pathname.ts";
import { LogEntrySchema, LogLevel as ProtoLogLevel } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import type { Manifest } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { encodeJson } from "./json.ts";
import type { WorkerClient } from "./client.ts";

const LEVELS: Record<LoggedEntry["level"], ProtoLogLevel> = {
  debug: ProtoLogLevel.DEBUG,
  info: ProtoLogLevel.INFO,
  warn: ProtoLogLevel.WARN,
  error: ProtoLogLevel.ERROR,
};

function wireEntry(entry: LoggedEntry): ReturnType<typeof create<typeof LogEntrySchema>> {
  return create(LogEntrySchema, {
    level: LEVELS[entry.level],
    action: entry.action,
    node: entry.node ?? "",
    actorType: entry.actorType ?? "",
    actorId: entry.actorId ?? "",
    metadata: encodeJson(entry.metadata ?? {}),
    timestamp: BigInt(entry.timestamp),
  });
}

/**
 * The `_log.ts` sinks a worker declared, and the delivery to them.
 *
 * Built from the manifest at handshake, because that is the only moment the
 * host learns what the project declared. Two sets of names rather than one map:
 * a node has a sink of its own, or it falls back to the root sink, and the
 * fallback is the whole reason the root one exists.
 */
export class WorkerLogSinks implements LogRouting {
  readonly #client: WorkerClient;
  readonly #nodes: ReadonlySet<string>;
  readonly #withSink: ReadonlySet<string>;
  readonly #root: boolean;

  constructor(client: WorkerClient, manifest: Manifest) {
    this.#client = client;
    this.#nodes = new Set(manifest.nodes.map((node) => node.name));
    this.#withSink = new Set(
      manifest.nodes.filter((node) => node.logSink).map((node) => node.name),
    );
    this.#root = manifest.rootLogSink;
  }

  /**
   * The node a path belongs to, read off its first segment.
   *
   * A node is mounted under its own name, so the segment is the answer, but
   * only when it names a node the manifest declared: `/health` must not be
   * reported as coming from a node called "health".
   */
  nodeOf(path: string): string | null {
    const segment = firstSegmentOf(path);

    return segment !== "" && this.#nodes.has(segment) ? segment : null;
  }

  claims(node: string | null): boolean {
    if (node !== null && this.#withSink.has(node)) return true;

    return this.#root;
  }

  async deliver(node: string | null, entries: readonly LoggedEntry[]): Promise<void> {
    const target = node !== null && this.#withSink.has(node) ? node : null;

    await this.#client.deliverLogs(target, entries.map(wireEntry));
  }
}
