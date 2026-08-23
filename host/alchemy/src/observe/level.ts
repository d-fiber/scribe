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

import type { UnmodifiableList } from "../value/list.ts";

/**
 * How much a recorded line matters.
 *
 * @remarks
 * Four and no more. A fifth is a decision rather than an implementation detail: every sink that
 * filters would grow a branch, and every deployment that sets a floor would have to be looked at
 * again.
 */
export type LoggedLevel = "debug" | "info" | "warn" | "error";

/** Every level, from the least to the most serious, which is the order they are compared in. */
export const LOGGED_LEVELS: UnmodifiableList<LoggedLevel> = ["debug", "info", "warn", "error"];

/**
 * Where `level` falls among the four, counting from zero.
 *
 * It is what a floor is compared against, so that "warn and above" is a comparison rather than a
 * list of the levels somebody remembered.
 */
export function severityOf(level: LoggedLevel): number {
  return LOGGED_LEVELS.indexOf(level);
}

/** Whether `level` is at least as serious as `floor`. */
export function atLeast(level: LoggedLevel, floor: LoggedLevel): boolean {
  return severityOf(level) >= severityOf(floor);
}

/** Whether `value` is one of the four levels. */
export function isLoggedLevel(value: string): value is LoggedLevel {
  return (LOGGED_LEVELS as UnmodifiableList<string>).includes(value);
}
