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

import type { ConsoleLogLevel, LogLevel } from "@scribe/core/contracts/logging.ts";

const RANK: Readonly<Record<ConsoleLogLevel, number>> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * The level a status code deserves.
 *
 * A refusal the caller brought on itself is a `warn`, not an `error`: the host
 * did its job. Only the 5xx range says something went wrong here.
 */
export function levelForStatus(status: number): LogLevel {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}

/** Whether an entry at `level` clears the `threshold` a deployment set. */
export function reaches(level: LogLevel, threshold: ConsoleLogLevel): boolean {
  return RANK[level] >= RANK[threshold];
}

/**
 * The level `name` spells, or `null` when it spells none.
 *
 * A misspelt level must not silence a terminal by accident, so the caller is
 * told rather than handed a default it did not ask for.
 */
export function consoleLevelNamed(name: string | undefined): ConsoleLogLevel | null {
  if (name === undefined) return null;

  const candidate = name.trim().toLowerCase();

  return Object.hasOwn(RANK, candidate) ? candidate as ConsoleLogLevel : null;
}
