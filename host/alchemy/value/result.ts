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

import type { Refusal } from "../error/refusal.ts";

/** A call that went through, carrying what it answered. */
export class Ok<T = void> {
  /** Always true, and what tells this apart from a {@link Failure} in a narrowing. */
  readonly ok = true as const;

  /**
   * Says a call went through, carrying `data`.
   *
   * @remarks
   * The argument is required. Leaving it out used to be allowed and the field was asserted into
   * place, so `new Ok<string>()` compiled and answered a string that was not there; the fault
   * surfaced wherever the caller first read it. A call carrying nothing says so with {@link okay}.
   *
   * @param data - What the call answered.
   */
  constructor(readonly data: T) {}
}

/** A call that went through and carries nothing, which is what `Ok<void>` is written as. */
export const okay: Ok<void> = new Ok<void>(undefined);

/** A call that did not go through, carrying what went wrong. */
export class Failure<E = Refusal> {
  /** Always false, and what tells this apart from an {@link Ok} in a narrowing. */
  readonly ok = false as const;

  /**
   * Says a call did not go through, carrying `error`.
   *
   * @remarks
   * The argument is required, for the reason {@link Ok} gives. What it carries is a {@link Refusal}
   * unless something else is named, which is what keeps the two ways of saying no from drifting
   * apart: the same five kinds describe a refusal whether it was raised or answered.
   *
   * @param error - What went wrong.
   */
  constructor(readonly error: E) {}
}

/**
 * Either outcome of a call, told apart by reading `ok`.
 *
 * @remarks
 * It is for the call whose failure is an outcome rather than a fault: a lookup that may find
 * nothing, a payment a bank declined. What is a fault in what somebody wrote is raised, not
 * answered, so a caller cannot carry on past it by forgetting to read a field.
 *
 * @example
 * ```ts
 * const outcome = await charge(card);
 * if (!outcome.ok) return this.response.unprocessable({ message: outcome.error });
 * ```
 */
export type Result<T, E = Refusal> = Ok<T> | Failure<E>;
