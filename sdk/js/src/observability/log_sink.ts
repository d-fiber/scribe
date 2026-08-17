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

import { type LogEntry, LogLevel } from "../../gen/scribe/protocol/logs_pb.ts";
import { decodeJson } from "../contracts/json.ts";

/** The severity of an entry, as a name rather than a protocol number. */
export type LoggedLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, LoggedLevel> = {
  [LogLevel.UNSPECIFIED]: "info",
  [LogLevel.DEBUG]: "debug",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
};

/**
 * One thing worth recording, in the shape a sink reads it.
 *
 * This is the protocol message with its wire concerns removed: the level is a
 * name, the timestamp a number, the metadata plain JSON, and everything a
 * protocol string leaves empty is `null` rather than `""`. A sink pushes these
 * somewhere, so it should not have to know how they travelled.
 */
export interface LoggedEntry {
  readonly level: LoggedLevel;

  /**
   * The node this entry came from, or `null` when it came from no node.
   *
   * A root sink sees both: entries of nodes that declare no sink of their own,
   * and entries the host raised on its own account, which belong to none.
   */
  readonly node: string | null;

  /** What happened: a route for an exchange, a name for anything else. */
  readonly action: string;
  readonly actorType: string | null;
  readonly actorId: string | null;
  readonly metadata: Record<string, unknown>;

  /** Milliseconds since the epoch, as `Date.now` gives them. */
  readonly timestamp: number;
  readonly traceId: string | null;
  readonly invocationId: string | null;
}

function orNull(value: string): string | null {
  return value === "" ? null : value;
}

/** Reads a protocol entry as the shape a sink takes. */
export function loggedEntry(entry: LogEntry): LoggedEntry {
  return {
    level: LEVELS[entry.level] ?? "info",
    node: orNull(entry.node),
    action: entry.action,
    actorType: orNull(entry.actorType),
    actorId: orNull(entry.actorId),
    metadata: decodeJson<Record<string, unknown>>(entry.metadata) ?? {},
    timestamp: Number(entry.timestamp),
    traceId: orNull(entry.traceId),
    invocationId: orNull(entry.invocationId),
  };
}

/**
 * Where a node's log entries go once the framework stops deciding for you.
 *
 * Declare one by exporting a subclass from a `_log.ts`: at the root of a node
 * to take that node's entries, or at `lib/_log.ts` to take everything no node
 * claimed. A node without one leaves its entries to the host's own shipper, so
 * declaring a sink is what moves the decision into the project.
 *
 * Nothing is printed for you once a sink exists. {@link printEntry} is the same
 * primitive the host uses, and calling it is a choice this class hands back.
 *
 * @example
 * ```ts
 * export class AppLogs extends LogSink {
 *   override async receive(entries: readonly LoggedEntry[]): Promise<void> {
 *     for (const entry of entries) printEntry(entry);
 *     await fetch(PUSHGATEWAY, { method: "POST", body: encode(entries) });
 *   }
 * }
 * ```
 */
export abstract class LogSink {
  /**
   * Takes a batch of entries.
   *
   * Batches, never single entries: a sink that forwards to a collector would
   * otherwise open one request per logged line. What it throws is caught and
   * reported by the worker, so a sink that fails cannot break the exchange it
   * was describing.
   */
  abstract receive(entries: readonly LoggedEntry[]): Promise<void> | void;
}
