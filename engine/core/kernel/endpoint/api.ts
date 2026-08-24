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

import type { Caller, RateLimit } from "@scribe/alchemy/route";
import { callersOf } from "@scribe/alchemy/route";
import { isAllowed } from "./access.ts";
import { ApiContext } from "./context.ts";
import { withinRateLimit } from "./rate_limit.ts";
import { RouteEndpoint } from "./route.ts";

export { ApiContext } from "./context.ts";
export { RouteEndpoint } from "./route.ts";

export abstract class ApiEndpoint extends RouteEndpoint {
  protected abstract rateLimit(): RateLimit;

  protected abstract access(): Caller | readonly Caller[];

  protected webhookVerified(): boolean {
    return false;
  }

  /**
   * Answers the request once the caller cleared the access check and the rate limit.
   *
   * @remarks
   * Both checks reach Redis and neither needs the other's answer, so they travel together. A
   * refused caller therefore spends a rate limit token, which is the half of the trade we want:
   * a flood of invalid tokens used to be answered without ever being counted.
   */
  protected async execute(): Promise<Response> {
    const callers = callersOf(this.access());

    const [allowed, withinLimit] = await Promise.all([
      isAllowed(callers, this.webhookVerified()),
      withinRateLimit(this.rateLimitKey(), this.rateLimit()),
    ]);

    if (!allowed) return this.response.unauthorized();
    if (!withinLimit) return this.response.tooManyRequests();

    return this.run(new ApiContext());
  }

  protected rateLimitKey(): string {
    return this.constructor.name;
  }

  static handle<T extends ApiEndpoint, TArgs extends unknown[]>(
    this: new (...args: TArgs) => T,
    ...args: TArgs
  ): Promise<Response> {
    return new this(...args).execute();
  }
}
