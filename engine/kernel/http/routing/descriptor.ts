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
import type { Caller, RateLimit, RouteMethod } from "@scribe/alchemy/route";

export interface RouteInvocation {
  /** The path parameters this route matched, keyed by their declared name. */
  readonly pathParams: Readonly<Record<string, string>>;
}

export type RouteHandler = (invocation: RouteInvocation) => Response | Future<Response>;

export interface RouteDescriptor {
  /** The HTTP method this route answers. */
  readonly method: RouteMethod;

  /** The route's path pattern, relative to the prefix `under` composes it with. */
  readonly path: string;

  /** Who may call this route, one caller or several, checked before the handler runs. */
  readonly access: Caller | readonly Caller[];

  /** The rate limit this route enforces per caller. */
  readonly rateLimit: RateLimit;

  /** The key the rate limit is tracked under, distinguishing this route's budget from every other's. */
  readonly rateLimitKey: string;

  /** The permissions a caller must hold beyond passing `access`, when this route needs more than identity. */
  readonly requiredPermissions?: readonly string[];

  /** Whether this route already checked a webhook signature, so the generic caller check does not ask for one too. */
  readonly webhookVerified?: boolean;

  /** The function that answers a request once `access`, `rateLimit` and any required permission have passed. */
  readonly handler: RouteHandler;
}

export function under(
  prefix: string,
  descriptors: readonly RouteDescriptor[],
): readonly RouteDescriptor[] {
  return descriptors.map((descriptor) => ({
    ...descriptor,
    path: descriptor.path === "/" ? prefix : `${prefix}${descriptor.path}`,
  }));
}
