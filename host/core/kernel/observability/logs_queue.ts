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

import type { LogEntry, LogShipper } from "@scribe/core/contracts/logging.ts";
import { LogBuffer } from "@scribe/core/kernel/observability/log_buffer.ts";
import { defineQueue } from "@scribe/core/runtime/event_driven/queue/mod.ts";

export type { LogEntry };

let shipper: LogShipper | null = null;

export const LogShipping = {
  use(next: LogShipper): void {
    shipper = next;
  },
};

/**
 * Hands the collector every entry the fetched messages carried.
 *
 * A message is a batch, so a fetch of a hundred messages is a hundred batches
 * and `flat` is what turns them back into the flat list the port takes. It
 * also carries across a deployment: a message written by an older host holds
 * one entry rather than an array, and flattening leaves it where it is.
 */
function shipLogEntries(batches: readonly (readonly LogEntry[])[]): Promise<void> {
  if (shipper === null) return Promise.resolve();

  return shipper.ship(batches.flat());
}

/**
 * The `logs` queue, whose message is a batch of entries rather than one entry.
 *
 * One message per request is one NATS round trip per request, on a path that
 * runs on every request. Producers therefore go through {@link logBuffer}
 * rather than pushing here directly.
 */
export const logsQueue = defineQueue<readonly LogEntry[]>(
  { name: "logs", batch: { lingerMs: 3_000 } },
  shipLogEntries,
);

export const logBuffer: LogBuffer = new LogBuffer((entries) => logsQueue.push(entries));
