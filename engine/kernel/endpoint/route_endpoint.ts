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
import { ServerResponse } from "@scribe/alchemy/route";
import { ApiContext } from "./context.ts";

/**
 * The base every HTTP endpoint in this kernel extends.
 *
 * @remarks
 * `ApiEndpoint`, which adds the access check and the rate limit, extends this rather than
 * duplicating it, so the one thing every endpoint truly shares, taking a context and producing a
 * response, lives in exactly one place regardless of how much else a concrete kind of endpoint
 * layers on top.
 */
export abstract class RouteEndpoint {
  /** The response builder subclasses use to construct an HTTP response, without importing it themselves. */
  protected readonly response = ServerResponse;

  /** Produces the response for `ctx`, implemented by each concrete endpoint. */
  protected abstract run(ctx: ApiContext): Response | Future<Response>;

  /**
   * Constructs an instance with `args` and answers a request straight from `run`, without the
   * access check or rate limit `ApiEndpoint.handle` adds.
   */
  static invoke<T extends RouteEndpoint, TArgs extends unknown[]>(
    this: new (...args: TArgs) => T,
    ...args: TArgs
  ): Future<Response> {
    return Promise.resolve(new this(...args).run(new ApiContext()));
  }
}
