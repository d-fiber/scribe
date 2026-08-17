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

import type { LoggedEntry, LoggedLevel } from "./log_sink.ts";

export const RESET = "\x1b[0m";
export const DIM = "\x1b[2m";
export const BOLD = "\x1b[1m";

const CYAN = "\x1b[96m";
const GREEN = "\x1b[92m";
const YELLOW = "\x1b[93m";
const MAGENTA = "\x1b[95m";
const RED = "\x1b[91m";
const WHITE = "\x1b[37m";

const METHOD_COLOR: Record<string, string> = {
  GET: CYAN,
  POST: GREEN,
  PATCH: YELLOW,
  PUT: MAGENTA,
  DELETE: RED,
};

const LEVEL_COLOR: Record<LoggedLevel, string> = {
  debug: WHITE,
  info: CYAN,
  warn: YELLOW,
  error: RED,
};

const METHOD_WIDTH = 6;

/** The method, padded and coloured the way the host colours it. */
export function styleMethod(method: string): string {
  const color = METHOD_COLOR[method] ?? WHITE;
  return `${color}${BOLD}${method.padEnd(METHOD_WIDTH)}${RESET}`;
}

/** The status, green under 400, amber under 500, red above. */
export function styleStatus(status: number): string {
  const color = status >= 500 ? RED : status >= 400 ? YELLOW : GREEN;
  return `${color}${BOLD}${status}${RESET}`;
}

export function styleLevel(level: LoggedLevel): string {
  return `${LEVEL_COLOR[level]}${BOLD}${level.toUpperCase().padEnd(5)}${RESET}`;
}

function exchangeOf(
  entry: LoggedEntry,
): { method: string; status: number; preview: string } | null {
  const { method, status, preview } = entry.metadata;

  return typeof method === "string" && typeof status === "number"
    ? { method, status, preview: typeof preview === "string" ? preview : "" }
    : null;
}

/**
 * The line this entry deserves, ready to be written.
 *
 * An exchange gets a two-line box closed by its status, and anything else gets
 * one line. Returned rather than written so a sink can send it somewhere that
 * is not a terminal.
 *
 * An exchange is recognised by its metadata carrying a `method` and a `status`,
 * which is what the host puts there. A failed one carries a `preview` of what
 * the response said, and it closes the box after the status.
 */
export function formatEntry(entry: LoggedEntry): string {
  const origin = entry.node === null ? "" : `${DIM}${entry.node}${RESET} `;
  const exchange = exchangeOf(entry);

  if (exchange === null) {
    return `${styleLevel(entry.level)} ${origin}${entry.action}`;
  }

  const opening = `${DIM}┌${RESET} ${origin}${styleMethod(exchange.method)} ${entry.action}`;
  // The preview rides on failures alone, so the closing line is the status by
  // itself on everything that went fine.
  const said = exchange.preview === "" ? "" : `  ${DIM}${exchange.preview}${RESET}`;
  const closing = `${DIM}└${RESET} ${styleStatus(exchange.status)}${said}`;

  return `${opening}\n${closing}`;
}

/**
 * Writes this entry to the terminal, as one call.
 *
 * One call and not two, even for the two-line form: two consecutive writes
 * interleave under concurrency, and a reader gets two openings followed by two
 * closings with no way to tell which belongs to which.
 */
export function printEntry(entry: LoggedEntry): void {
  console.log(formatEntry(entry));
}
