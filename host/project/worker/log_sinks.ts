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

import { create } from "@bufbuild/protobuf";
import type { LogEntry, LogRouting } from "@scribe/core/contracts/logging.ts";
import { firstSegmentOf } from "@scribe/core/runtime/http/pathname.ts";
import { LogEntrySchema, LogLevel } from "@scribe/sdk/gen/scribe/protocol/logs_pb.ts";
import type { Manifest } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { encodeJson } from "./json.ts";
import type { WorkerClient } from "./worker_client.ts";

const LEVELS: Record<LogEntry["level"], LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

function wireEntry(entry: LogEntry): ReturnType<typeof create<typeof LogEntrySchema>> {
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

  async deliver(node: string | null, entries: readonly LogEntry[]): Promise<void> {
    const target = node !== null && this.#withSink.has(node) ? node : null;

    await this.#client.deliverLogs(target, entries.map(wireEntry));
  }
}
