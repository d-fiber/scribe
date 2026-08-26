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

import type { Caller, Need, RouteMethod } from "../contracts/access.ts";
import type { RateLimiter } from "../contracts/rate_limit.ts";
import type { RequestContext } from "../runtime/context.ts";
import type { Contribution } from "./contribution.ts";

export interface EndpointDocumentation {
  readonly method: RouteMethod;
  readonly description: string | null;
}

export abstract class Endpoint {

  abstract readonly method: RouteMethod;

  protected access(): Caller | readonly Caller[] | null {
    return null;
  }

  protected permissions(): readonly string[] {
    return [];
  }

  protected rateLimit(): RateLimiter | null {
    return null;
  }

  protected rateLimitKey(): string | null {
    return null;
  }

  protected needs(): readonly Need[] {
    return [];
  }

  protected webhookVerified(): boolean | null {
    return null;
  }

  protected description(): string | null {
    return null;
  }

  protected abstract run(ctx: RequestContext): Response | Promise<Response>;

  contribution(): Contribution {
    return {
      access: this.access(),
      permissions: this.permissions(),
      rateLimit: this.rateLimit(),
      rateLimitKey: this.rateLimitKey(),
      needs: this.needs(),
      webhookVerified: this.webhookVerified(),
      wrap: null,
    };
  }

  documentation(): EndpointDocumentation {
    return { method: this.method, description: this.description() };
  }

  handle(ctx: RequestContext): Promise<Response> {
    return Promise.resolve(this.run(ctx));
  }
}

export abstract class Get extends Endpoint {
  override readonly method: RouteMethod = "get";
}

export abstract class Post extends Endpoint {
  override readonly method: RouteMethod = "post";
}

export abstract class Put extends Endpoint {
  override readonly method: RouteMethod = "put";
}

export abstract class Patch extends Endpoint {
  override readonly method: RouteMethod = "patch";
}

export abstract class Delete extends Endpoint {
  override readonly method: RouteMethod = "delete";
}
