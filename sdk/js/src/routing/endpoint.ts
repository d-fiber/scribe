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

import type { Caller, Need, RouteMethod } from "../contracts/access.ts";
import type { RateLimiter } from "../contracts/rate_limit.ts";
import { ServerResponse } from "../http/response.ts";
import type { InvocationContext } from "../runtime/context.ts";
import type { Contribution } from "./contribution.ts";

export interface EndpointDocumentation {
  readonly method: RouteMethod;
  readonly description: string | null;
}

export abstract class Endpoint {
  protected readonly response = ServerResponse;

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

  protected abstract run(ctx: InvocationContext): Response | Promise<Response>;

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

  handle(ctx: InvocationContext): Promise<Response> {
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
