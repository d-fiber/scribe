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

import { Slot } from "../bind/slot.ts";
import type { LoggedLevel } from "./level.ts";

/** What a caller may say about a line beyond the line itself. */
export interface LogInput {
  /** What kind of thing acted: a user, a service, a scheduled run. */
  readonly actorType?: string;

  /** What identifies whoever acted. */
  readonly actorId?: string;

  /** Whatever else is worth keeping, as long as it survives being written as JSON. */
  readonly metadata?: unknown;
}

/**
 * What records what happened.
 *
 * @remarks
 * A package writes against this and never against what carries the line. Where it goes, whether it
 * is batched, and what it costs are the host's business.
 *
 * The four members are the four levels and nothing else. There is no way to record a line without
 * saying how much it matters, which is what keeps a log readable: a floor is a comparison rather
 * than a guess about which names somebody used.
 */
export interface Logger {
  /** Records something only useful while somebody is looking. */
  debug(action: string, input?: LogInput): void;

  /** Records something that happened and was meant to. */
  info(action: string, input?: LogInput): void;

  /** Records something that worked and should not have to. */
  warn(action: string, input?: LogInput): void;

  /** Records something that did not work. */
  error(action: string, input?: LogInput): void;

  /** Records at `level`, for a caller that decides the level rather than writing it. */
  at(level: LoggedLevel, action: string, input?: LogInput): void;
}

/**
 * What answers a package that needs to record something.
 *
 * The host fills it once, at boot, with whatever ships the lines, and a test fills it with
 * something that keeps them so a case can read what was recorded.
 */
export const Loggers: Slot<Logger> = new Slot<Logger>("Loggers");

/**
 * The logger in force, read at the call and never before.
 *
 * @example
 * ```ts
 * log.info("audience.member_added", { actorId: caller.id, metadata: { audience } });
 * ```
 */
export const log: Logger = {
  debug: (action, input) => Loggers.get().debug(action, input),
  info: (action, input) => Loggers.get().info(action, input),
  warn: (action, input) => Loggers.get().warn(action, input),
  error: (action, input) => Loggers.get().error(action, input),
  at: (level, action, input) => Loggers.get().at(level, action, input),
};
