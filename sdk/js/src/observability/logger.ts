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
import {
  type LogEntry,
  LogEntrySchema,
  LogLevel,
  Logging,
} from "../../gen/scribe/protocol/logs_pb.ts";
import { encodeJson } from "../contracts/json.ts";
import { CallScope } from "../runtime/scope.ts";
import { host } from "../capabilities/channel.ts";
import { type LogSink, loggedEntry } from "./log_sink.ts";
import type { SinkRegistry } from "./sink_registry.ts";

const BATCH_THRESHOLD = 25;

const consoles: Record<LogLevel, (message: string) => void> = {
  [LogLevel.UNSPECIFIED]: console.log,
  [LogLevel.DEBUG]: console.debug,
  [LogLevel.INFO]: console.info,
  [LogLevel.WARN]: console.warn,
  [LogLevel.ERROR]: console.error,
};

export interface LogInput {
  readonly actorType?: string;
  readonly actorId?: string;
  readonly metadata?: unknown;
}

class Logger {
  #pending: LogEntry[] = [];
  #sinks: SinkRegistry | null = null;

  /**
   * Points this logger at the sinks the server declared.
   *
   * Called once, when the worker definition is built. Until it is, entries go
   * to the host as they always did, which is what keeps a project that never
   * declared a `_log.ts` working exactly as before.
   */
  useSinks(sinks: SinkRegistry): void {
    this.#sinks = sinks;
  }

  debug(action: string, input: LogInput = {}): void {
    this.#record(LogLevel.DEBUG, action, input);
  }

  info(action: string, input: LogInput = {}): void {
    this.#record(LogLevel.INFO, action, input);
  }

  warn(action: string, input: LogInput = {}): void {
    this.#record(LogLevel.WARN, action, input);
  }

  error(action: string, input: LogInput = {}): void {
    this.#record(LogLevel.ERROR, action, input);
  }

  /**
   * Sends what is pending, to the project's own sinks or to the host.
   *
   * A sink that claims an entry lives in this very process, so the entry is
   * handed over directly rather than shipped to the host for it to send it
   * straight back. Entries are grouped by node first, because one buffer holds
   * whatever the process logged and two nodes must not read each other's.
   *
   * Nothing is put back on a sink failure: unlike the host, a sink is the final
   * destination, and retrying it would grow the buffer for as long as it stays
   * broken. What could not reach the host, on the other hand, is kept.
   */
  async flush(): Promise<void> {
    if (this.#pending.length === 0) return;

    const pending = this.#pending;
    this.#pending = [];

    const unclaimed: LogEntry[] = [];
    for (const [sink, entries] of this.#groupBySink(pending)) {
      if (sink === null) {
        unclaimed.push(...entries);
        continue;
      }

      try {
        await sink.receive(entries.map(loggedEntry));
      } catch (cause) {
        console.error("[worker] a log sink threw:", cause);
      }
    }

    if (unclaimed.length === 0) return;
    if (!host.connected()) {
      this.#pending = [...unclaimed, ...this.#pending];
      return;
    }

    try {
      await host.client().call(Logging.method.ship, { entries: unclaimed });
    } catch {
      this.#pending = [...unclaimed, ...this.#pending];
    }
  }

  get pending(): number {
    return this.#pending.length;
  }

  /** The entries of [pending], gathered under the sink each one belongs to. */
  #groupBySink(pending: readonly LogEntry[]): Map<LogSink | null, LogEntry[]> {
    const grouped = new Map<LogSink | null, LogEntry[]>();

    for (const entry of pending) {
      const node = entry.node === "" ? null : entry.node;
      const sink = this.#sinks?.resolve(node) ?? null;
      const bucket = grouped.get(sink);
      if (bucket) bucket.push(entry);
      else grouped.set(sink, [entry]);
    }

    return grouped;
  }

  #record(level: LogLevel, action: string, input: LogInput): void {
    const scope = CallScope.current();

    // A node that declared a sink prints from there or not at all: the sink is
    // handed the primitives and the decision, and printing here as well would
    // put every line on the terminal twice.
    if (this.#sinks?.resolve(scope.node === "" ? null : scope.node) == null) {
      consoles[level](`[worker] ${action}`);
    }

    this.#pending.push(
      create(LogEntrySchema, {
        level,
        action,
        node: scope.node,
        actorType: input.actorType ?? "",
        actorId: input.actorId ?? "",
        metadata: encodeJson(input.metadata ?? {}),
        timestamp: BigInt(Date.now()),
        traceId: scope.traceId,
        invocationId: scope.invocationId,
      }),
    );

    if (this.#pending.length >= BATCH_THRESHOLD) void this.flush();
  }
}

export const log = new Logger();
