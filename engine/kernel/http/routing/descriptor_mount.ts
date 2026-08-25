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

import type { Context, Hono } from "hono";
import { callersOf, ServerResponse } from "@scribe/alchemy/route";
import { isAllowed } from "@scribe/kernel/endpoint/access.ts";
import { withinRateLimit } from "@scribe/kernel/endpoint/rate_limit.ts";
import { RbacIdentity } from "@scribe/kernel/identity/request_identity.ts";
import type { RouteDescriptor } from "./descriptor.ts";

async function grantsAll(required: readonly string[]): Promise<boolean> {
  const granted = await RbacIdentity.permissions();
  return required.every((permission) => granted.includes(permission));
}

async function serve(descriptor: RouteDescriptor, c: Context): Promise<Response> {
  const callers = callersOf(descriptor.access);

  // Same reasoning as the worker routes in embedder/control/mount.ts: the limiter
  // does not need to know who is calling, so it runs alongside the lookup.
  const [allowed, withinLimit] = await Promise.all([
    isAllowed(callers, descriptor.webhookVerified ?? false),
    withinRateLimit(descriptor.rateLimitKey, descriptor.rateLimit),
  ]);

  if (!allowed) return ServerResponse.unauthorized();

  const required = descriptor.requiredPermissions ?? [];
  if (required.length > 0 && !(await grantsAll(required))) {
    return ServerResponse.forbidden({
      code: "not_permitted",
      message: "You do not have the required permission to perform this action.",
    });
  }

  if (!withinLimit) return ServerResponse.tooManyRequests();

  return descriptor.handler({ pathParams: c.req.param() });
}

export function mountDescriptors(app: Hono, descriptors: readonly RouteDescriptor[]): void {
  for (const descriptor of descriptors) {
    app[descriptor.method](descriptor.path, (c) => serve(descriptor, c));
  }
}
