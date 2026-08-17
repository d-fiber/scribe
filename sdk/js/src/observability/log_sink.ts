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
 * How many entries gather before {@link LogSink.block} is called.
 *
 * A hundred is small enough that a quiet node still ships something on its own,
 * and large enough that a busy one stops opening a request per logged line.
 */
const BLOCK_SIZE = 100;

/**
 * How long an unfinished block waits before it is handed over anyway.
 *
 * Without it a node that logs slowly would hold its last few entries until the
 * process ends, which is exactly when nobody is reading them any more.
 */
const LINGER_MS = 5_000;

/**
 * Where a node's log entries go once the framework stops deciding for you.
 *
 * Declare one by exporting a subclass from a `_log.ts`: at the root of a node
 * to take that node's entries, or at `lib/_log.ts` to take everything no node
 * claimed. A node without one leaves its entries to the host's own shipper, so
 * declaring a sink is what moves the decision into the project.
 *
 * A sink has two ways of reading what it is handed, and they answer different
 * needs. {@link each} sees every entry the moment it arrives, which is what
 * printing wants. {@link block} sees them by the hundred, which is what sending
 * them somewhere wants: a collector reached one entry at a time is a request
 * per logged line. Overriding either is optional, and overriding neither is a
 * sink that quietly drops what it takes.
 *
 * Nothing is printed for you once a sink exists. {@link printEntry} is the same
 * primitive the host uses, and calling it is a choice this class hands back.
 *
 * @example
 * ```ts
 * export class AppLogs extends LogSink {
 *   protected override blockSize(): number {
 *     return 500;
 *   }
 *
 *   protected override each(entry: LoggedEntry): void {
 *     printEntry(entry);
 *   }
 *
 *   protected override async block(entries: readonly LoggedEntry[]): Promise<void> {
 *     await fetch(COLLECTOR, { method: "POST", body: JSON.stringify(entries) });
 *   }
 * }
 * ```
 */
export abstract class LogSink {
  #held: LoggedEntry[] = [];
  #timer: number | null = null;

  /**
   * Takes a delivery, and calls back what this sink declared.
   *
   * This is the framework's way in, and a sink has no reason to override it:
   * {@link each} and {@link block} are where a project decides anything. What
   * they throw is caught and reported by the caller, so a sink that fails
   * cannot break the exchange it was describing -- but the rest of that
   * delivery is lost with it.
   */
  async receive(entries: readonly LoggedEntry[]): Promise<void> {
    for (const entry of entries) {
      // Awaiting unconditionally would cost a microtask per entry on the
      // common case, which is a sink that prints and returns nothing.
      const seen = this.each(entry);
      if (seen !== undefined) await seen;
    }

    const size = this.blockSize();
    if (size <= 0) {
      await this.#hand(entries);
      return;
    }

    this.#held.push(...entries);

    while (this.#held.length >= size) await this.#hand(this.#held.splice(0, size));

    if (this.#held.length > 0) this.#arm();
    else this.#disarm();
  }

  /**
   * How many entries {@link block} takes at a time.
   *
   * Zero or less turns the gathering off: {@link block} is then called with
   * each delivery exactly as it arrives, which is the cheapest path and the one
   * to take when the entries are handed straight to something local.
   */
  protected blockSize(): number {
    return BLOCK_SIZE;
  }

  /** Takes one entry, as soon as it arrives. */
  protected each(_entry: LoggedEntry): Promise<void> | void {}

  /** Takes {@link blockSize} entries at a time. */
  protected block(_entries: readonly LoggedEntry[]): Promise<void> | void {}

  /**
   * Hands over what an unfinished block is holding.
   *
   * Called on its own after {@link LINGER_MS}, and worth calling by hand from a
   * project that knows it is about to stop.
   */
  async flush(): Promise<void> {
    this.#disarm();
    if (this.#held.length === 0) return;

    const held = this.#held;
    this.#held = [];
    await this.#hand(held);
  }

  async #hand(entries: readonly LoggedEntry[]): Promise<void> {
    const taken = this.block(entries);
    if (taken !== undefined) await taken;
  }

  #arm(): void {
    if (this.#timer !== null) return;

    this.#timer = setTimeout(() => {
      this.#timer = null;

      // Nobody is waiting on this one, so a sink that throws here would come
      // back as an unhandled rejection and take the worker down with it.
      this.flush().catch((cause) => {
        console.error("[worker] a log sink threw on its own flush:", cause);
      });
    }, LINGER_MS);
  }

  #disarm(): void {
    if (this.#timer === null) return;

    clearTimeout(this.#timer);
    this.#timer = null;
  }
}
