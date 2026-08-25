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
import { type LogEntry, LogEntrySchema, Logging, LogLevel } from "../../gen/scribe/protocol/logs_pb.ts";
import { encodeJson } from "../contracts/json.ts";
import { CallScope } from "../runtime/scope.ts";
import { host } from "../capabilities/channel.ts";
import { loggedEntry, type LogSink } from "./log_sink.ts";
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

/**
 * The worker's log, as everything outside this file uses it.
 *
 * @remarks
 * An entry is held in the process rather than sent as it is written. The buffer empties on its
 * own once twenty five entries are waiting, and whenever {@link WorkerLogger.flush} is called.
 */
export interface WorkerLogger {
  /**
   * Points this logger at the sinks the server declared.
   *
   * Called once, when the worker definition is built. Until it is, entries go
   * to the host as they always did, which is what keeps a project that never
   * declared a `_log.ts` working exactly as before.
   */
  useSinks(sinks: SinkRegistry): void;

  /**
   * Records `action` at debug level, under the node the current call scope names.
   *
   * A node whose sink claims the entry prints it there and nowhere else, so a line never lands on
   * the terminal twice.
   */
  debug(action: string, input?: LogInput): void;

  /** Records `action` at info level, under the node the current call scope names. */
  info(action: string, input?: LogInput): void;

  /** Records `action` at warning level, under the node the current call scope names. */
  warn(action: string, input?: LogInput): void;

  /**
   * Records `action` at error level, under the node the current call scope names.
   *
   * Nothing is thrown and nothing is flushed early: an error entry travels like the others.
   */
  error(action: string, input?: LogInput): void;

  /**
   * Sends what is pending, to the project's own sinks or to the host.
   *
   * @remarks
   * A sink that claims an entry lives in this very process, so the entry is
   * handed over directly rather than shipped to the host for it to send it
   * straight back. Entries are grouped by node first, because one buffer holds
   * whatever the process logged and two nodes must not read each other's.
   *
   * Nothing is put back on a sink failure: unlike the host, a sink is the final
   * destination, and retrying it would grow the buffer for as long as it stays
   * broken. What could not reach the host, on the other hand, is kept.
   */
  flush(): Promise<void>;

  /** How many entries are waiting to be sent, which is what a caller polls to know it can stop. */
  readonly pending: number;
}

export const log: WorkerLogger = new Logger();
