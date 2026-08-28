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

import type { Future } from "../../async/future.ts";
import type { UnmodifiableList } from "../../value/list.ts";
import type { Caller, Need, RouteMethod } from "./access.ts";
import type { RateLimit } from "./rate_limit.ts";
import { ServerResponse } from "./response.ts";
import type { RequestContext } from "./context.ts";
import type { Contribution } from "./mount/contribution.ts";
import { BASE } from "./mount/instances.ts";

/** What an endpoint says about itself to whatever writes the documentation of a node. */
export interface EndpointDocumentation {
  /** The verb this endpoint answers. */
  readonly method: RouteMethod;

  /** The sentence the endpoint gave about what it does, or null when it gave none. */
  readonly description: string | null;
}

/**
 * One route, written as a class: what it requires, and what it answers.
 *
 * @remarks
 * A project writes a subclass per route, and the only member it has to fill is {@link run}. The
 * rest are declarations with an answer already, and overriding one is how an endpoint says it wants
 * something other than the default.
 *
 * They are methods rather than fields because a subclass overrides a method without touching a
 * constructor, and because what an endpoint requires sometimes depends on what it was built with.
 *
 * Nothing here answers a request. What an endpoint declares is gathered by
 * {@link contribution}, merged with what the middlewares above it declared, and the framework is
 * what puts a call through the result.
 *
 * @example
 * ```ts
 * export default class extends Get {
 *   protected override access() {
 *     return "authenticated";
 *   }
 *
 *   protected override run(ctx: RequestContext) {
 *     return this.response.ok({ id: ctx.user.id });
 *   }
 * }
 * ```
 */
export abstract class Endpoint {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static readonly [BASE] = true;

  /** How this endpoint writes its answer, reached as `this.response` from inside {@link run}. */
  protected readonly response = ServerResponse;

  /** The verb this endpoint answers, which its base class fills. */
  abstract readonly method: RouteMethod;

  /**
   * Who may call this endpoint, one {@link Caller} or several.
   *
   * Null leaves the question to whatever middleware sits above, and an endpoint under nothing that
   * answers it is refused every call.
   */
  protected access(): Caller | UnmodifiableList<Caller> | null {
    return null;
  }

  /** What the caller has to have been granted on top of being the right kind of caller. */
  protected permissions(): UnmodifiableList<string> {
    return [];
  }

  /** How often this endpoint may be called, or null to take what the middleware above declared. */
  protected rateLimit(): RateLimit | null {
    return null;
  }

  /**
   * What the count is kept against, or null to count against the caller.
   *
   * It is what makes two endpoints share one quota, or one endpoint count per tenant rather than
   * per caller.
   */
  protected rateLimitKey(): string | null {
    return null;
  }

  /** What a call has to carry beyond who is making it, refused when it arrives without. */
  protected needs(): UnmodifiableList<Need> {
    return [];
  }

  /**
   * Whether the signature of an incoming hook has to have been checked already.
   *
   * Null takes what the middleware above declared, which is what an endpoint under a hook root
   * wants: the root says it once for everything beneath it.
   */
  protected webhookVerified(): boolean | null {
    return null;
  }

  /** What this endpoint does, in one sentence, for whatever writes the documentation of a node. */
  protected description(): string | null {
    return null;
  }

  /**
   * Answers the call, and is the one member an endpoint has to write.
   *
   * @param ctx - The call: who made it, what it carried, and what it says about itself.
   * @returns The answer, built through `this.response`. It may be given as a future.
   */
  protected abstract run(ctx: RequestContext): Response | Future<Response>;

  /**
   * Everything this endpoint declares, gathered into one layer.
   *
   * It is what the framework merges with the layers of the middlewares above, and an endpoint has
   * no reason to override it: what it wants to change is one of the declarations it gathers.
   */
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

  /** What this endpoint says about itself, for whatever writes the documentation of a node. */
  documentation(): EndpointDocumentation {
    return { method: this.method, description: this.description() };
  }

  /**
   * Runs {@link run} and hands back its answer as a future, whichever of the two it gave.
   *
   * It is the framework's way in, and an endpoint has no reason to override it.
   */
  handle(ctx: RequestContext): Future<Response> {
    return Promise.resolve(this.run(ctx));
  }
}

/** An endpoint that answers a read. */
export abstract class Get extends Endpoint {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static override readonly [BASE] = true;

  /** The verb this class fixes for every endpoint that extends it. */
  override readonly method: RouteMethod = "get";
}

/** An endpoint that answers a call meant to create something. */
export abstract class Post extends Endpoint {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static override readonly [BASE] = true;

  /** The verb this class fixes for every endpoint that extends it. */
  override readonly method: RouteMethod = "post";
}

/** An endpoint that answers a call meant to replace something. */
export abstract class Put extends Endpoint {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static override readonly [BASE] = true;

  /** The verb this class fixes for every endpoint that extends it. */
  override readonly method: RouteMethod = "put";
}

/** An endpoint that answers a call meant to change part of something. */
export abstract class Patch extends Endpoint {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static override readonly [BASE] = true;

  /** The verb this class fixes for every endpoint that extends it. */
  override readonly method: RouteMethod = "patch";
}

/** An endpoint that answers a call meant to remove something. */
export abstract class Delete extends Endpoint {
  /** Marks this class as one to extend, so discovery never mounts it. */
  static override readonly [BASE] = true;

  /** The verb this class fixes for every endpoint that extends it. */
  override readonly method: RouteMethod = "delete";
}
