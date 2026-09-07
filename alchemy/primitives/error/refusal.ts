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
import { ScribeError } from "./scribe_error.ts";

/**
 * The five ways a call is refused, and there is no sixth.
 *
 * @remarks
 * The list is closed on purpose. It says what happened in terms of the call itself, never in terms
 * of the protocol that carried it, so the same refusal reads the same whether it came over HTTP,
 * out of a queue or from a scheduled run. Whoever answers the caller is the one that knows what a
 * status code is, and it maps these five to whatever its protocol has.
 *
 * Adding a sixth is a decision rather than an implementation detail: every host that maps them has
 * to grow a branch, and every package that reads them has to be looked at again.
 */
export type RefusalKind =
  /** The thing the call names does not exist here. */
  | "missing"
  /** The caller is not allowed to do this, whether or not the thing exists. */
  | "denied"
  /** The call is well formed, and the state it needs is not the state there is. */
  | "conflict"
  /** What was passed cannot be acted on at all, whatever the state happens to be. */
  | "invalid"
  /** Nothing is wrong with the call, and something it needs is not answering. */
  | "unavailable";

/**
 * Every kind, in one place, so a host that maps them can be made to cover all five.
 *
 * @remarks
 * A host builds its mapping as a record keyed by this and lets the compiler refuse an incomplete
 * one. That is what turns a sixth kind into an error where the mapping is written, rather than into
 * a call answered wrongly at run time.
 */
export const REFUSAL_KINDS: UnmodifiableList<RefusalKind> = [
  "missing",
  "denied",
  "conflict",
  "invalid",
  "unavailable",
];

/**
 * A call that will not be answered, said in terms of the call and not of the protocol.
 *
 * @remarks
 * It descends from {@link ScribeError} because it is printed as its sentence and nothing else: the
 * stack would name the code that refused, and that code is not where the mistake is.
 *
 * **The message is written for whoever made the call.** It travels outward, so a package that does
 * not want to say why writes a message that does not say why. Nothing here decides that for it.
 *
 * There is no public constructor. The five named ways in are the only ones, so a refusal cannot be
 * built carrying a kind that does not match what it says.
 *
 * @example
 * ```ts ignore
 * const audience = declared.get(name);
 * if (!audience) throw Refusal.missing(`no audience is declared under "${name}".`);
 * ```
 */
export class Refusal extends ScribeError {
  /** Which of the five this is. It is what a host maps, and it is fixed at construction. */
  readonly kind: RefusalKind;

  /**
   * Builds a refusal of `kind`.
   *
   * It is private so the five below are the only way in: the list of kinds is closed, and a sixth
   * one written at a call site would be a kind the host has no mapping for.
   */
  private constructor(kind: RefusalKind, message: string, options?: ErrorOptions) {
    super(message, options);
    this.kind = kind;
  }

  /**
   * The thing the call names does not exist here.
   *
   * @remarks
   * Choosing between this and {@link denied} tells the caller whether the thing exists, which is
   * something they may not be entitled to know. When that matters, answer `missing` for both.
   */
  static missing(message: string, options?: ErrorOptions): Refusal {
    return new Refusal("missing", message, options);
  }

  /** The caller is not allowed to do this, whether or not the thing it names exists. */
  static denied(message: string, options?: ErrorOptions): Refusal {
    return new Refusal("denied", message, options);
  }

  /**
   * The call is well formed, and the state it needs is not the state there is.
   *
   * @remarks
   * Making the same call again unchanged gives the same answer, because what has to change is the
   * state and not the call. That is what separates it from {@link unavailable}.
   */
  static conflict(message: string, options?: ErrorOptions): Refusal {
    return new Refusal("conflict", message, options);
  }

  /**
   * What was passed cannot be acted on at all, whatever the state happens to be.
   *
   * @remarks
   * A missing field, a number out of range, two options that cannot both be given. It is about the
   * call as written, so no state anywhere would make it work.
   */
  static invalid(message: string, options?: ErrorOptions): Refusal {
    return new Refusal("invalid", message, options);
  }

  /**
   * Nothing is wrong with the call, and something it needs is not answering.
   *
   * @remarks
   * It is the only one of the five that says nothing about the call, so it is the only one where
   * making the same call later can give a different answer.
   */
  static unavailable(message: string, options?: ErrorOptions): Refusal {
    return new Refusal("unavailable", message, options);
  }
}
