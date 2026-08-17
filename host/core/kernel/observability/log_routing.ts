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

import type { LogEntry, LogRouting } from "@scribe/core/contracts/logging.ts";

/**
 * What a host with no project sink does: nothing, for every question.
 *
 * This is the state of a process with no worker at all, and of one whose worker
 * declared no `_log.ts`. Both are ordinary: the entries stay on the host's own
 * path, and nobody has to check whether a router was registered.
 */
const UNCLAIMED: LogRouting = {
  nodeOf: () => null,
  claims: () => false,
  deliver: () => Promise.resolve(),
};

let routing: LogRouting = UNCLAIMED;

export const LogRoutes = {
  /** Points the host at the sinks a worker's manifest declared. */
  use(next: LogRouting): void {
    routing = next;
  },

  /**
   * Forgets them, which is what a worker going away means.
   *
   * Without this a replaced manifest would keep the previous one's claims, and
   * the host would go on delivering to sinks the new worker never declared.
   */
  reset(): void {
    routing = UNCLAIMED;
  },

  get current(): LogRouting {
    return routing;
  },
};
