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

export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * How much of the request log the terminal is worth writing.
 *
 * `silent` names no entry, so it turns the terminal off without turning
 * shipping off with it. The two are separate: what an operator reads on a
 * terminal and what a collector keeps are not the same question.
 */
export type ConsoleLogLevel = LogLevel | "silent";

export interface LogEntry {
  readonly level: LogLevel;
  readonly action: string;
  readonly actorType?: string;
  readonly actorId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: number;

  /**
   * The node this entry belongs to, or `null` when it belongs to none.
   *
   * A cron pass, a queue drain and the boot sequence all belong to none: they
   * are the host acting on its own account rather than serving one of the
   * project's nodes.
   */
  readonly node?: string | null;
}

export interface LogShipper {
  ship(entries: readonly LogEntry[]): Promise<void>;
}

/**
 * Where the project decided its own entries should go, when it decided at all.
 *
 * The port exists because the decision lives in project code -- a `_log.ts`
 * running in the worker -- while the entries are raised in `kernel/`, which
 * cannot import `project/`. The host asks two questions and hands over a batch;
 * everything about how a sink was declared stays on the other side.
 */
export interface LogRouting {
  /**
   * The node that owns `path`, or `null` when no declared node does.
   *
   * The host reads the node off the request path rather than being told: a
   * node is mounted under its own name, so the first segment is the answer.
   */
  nodeOf(path: string): string | null;

  /**
   * Whether a sink takes delivery of what `node` produced.
   *
   * `false` means the entry stays on the host's own path -- the queue, then
   * whatever `LOG_SHIP_URL` names. It is also what decides whether the host
   * still prints the exchange: a node with a sink prints from there or not at
   * all.
   */
  claims(node: string | null): boolean;

  /** Hands a batch to the sink that claimed it. */
  deliver(node: string | null, entries: readonly LogEntry[]): Promise<void>;
}
