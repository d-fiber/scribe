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

import { RequestScope } from "@scribe/runtime/scope.ts";
import { constantTimeEqual } from "@scribe/runtime/support/crypto/constant_time.ts";

/**
 * What a firewall that checks a shared secret against a header has in common, shared as static helpers.
 *
 * @remarks
 * {@link AppKeyFirewall} and {@link InternalSecretFirewall} both reduce to the same three steps,
 * read the header, compare it against one or more known-good values, decide, so this base carries
 * that logic once rather than each firewall reimplementing its own comparison and risking one of
 * them comparing in variable time by accident.
 */
export abstract class SecretFirewall {
  /** The value of `headerName` on the request in scope, or `null` when it is absent. */
  protected static headerValue(headerName: string): string | null {
    return RequestScope.get().headers.get(headerName);
  }

  /**
   * Whether `provided` matches one of `candidates`.
   *
   * @remarks
   * Each comparison runs in constant time through `constantTimeEqual`, so a caller cannot measure
   * how much of a guessed secret matched from how long the response took to come back: a
   * string-equality check that returns as soon as it finds a mismatched byte would leak exactly
   * that.
   */
  protected static matchesAny(
    provided: string,
    candidates: readonly string[],
  ): boolean {
    return candidates.some((candidate) => constantTimeEqual(provided, candidate));
  }

  /** Whether `headerName` on the request in scope carries one of `candidates`. */
  protected static verifyHeader(
    headerName: string,
    candidates: readonly string[],
  ): boolean {
    const provided = this.headerValue(headerName);
    return provided !== null && this.matchesAny(provided, candidates);
  }
}
