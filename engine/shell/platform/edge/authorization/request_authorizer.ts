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

import type { Future } from "@scribe/alchemy";

/**
 * Decides whether a request may reach `service`, before the edge runtime dispatches it to a worker.
 *
 * @remarks
 * The check happens here, ahead of dispatch, rather than inside the worker itself, because a
 * worker isolate is not free to start: refusing a request before one is spun up is what keeps an
 * unauthenticated flood from costing this deployment a worker per attempt. Two implementations
 * exist, one for a deployment that verifies a JWT and one for a deployment that verifies none, so
 * the rest of the edge runtime never has to branch on whether verification is turned on.
 */
export interface RequestAuthorizer {
  /**
   * `null` to let `request` through to `service`, or the response to answer instead when it is
   * refused.
   */
  authorize(request: Request, service: string): Future<Response | null>;
}

/**
 * The {@link RequestAuthorizer} a deployment gets when `config.verifyJwt` is turned off.
 *
 * @remarks
 * `factory.ts` chooses this over {@link JwtRequestAuthorizer} at boot, once, based on that one
 * setting. Nothing downstream of the choice has to know it was made: every caller reads the same
 * `RequestAuthorizer` interface, so a deployment that trusts its own network perimeter instead of
 * a token never carries a branch for the case it opted out of.
 */
export class OpenRequestAuthorizer implements RequestAuthorizer {
  /**
   * The {@link RequestAuthorizer.authorize} implementation: always `null`.
   *
   * @remarks
   * There is nothing to check when JWT verification is off, so this answers `null` unconditionally
   * rather than the caller skipping the authorizer altogether: keeping the same interface on both
   * paths is what let `JwtRequestAuthorizer` be swapped in later without touching whatever calls
   * `authorize`.
   */
  authorize(): Future<Response | null> {
    return Promise.resolve(null);
  }
}
