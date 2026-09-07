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

import type { Context } from "hono";
import type { Future } from "@scribe/alchemy";
import type { Reply } from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import { isAllowed } from "@scribe/kernel/endpoint/access.ts";
import { withinRateLimit } from "@scribe/kernel/endpoint/rate_limit.ts";
import { ServerResponse } from "@scribe/alchemy/route";
import { RbacIdentity } from "@scribe/kernel/identity/request_identity.ts";
import { currentIdentity } from "@scribe/runtime/http/accessors/identity.ts";
import { request } from "@scribe/runtime/http/request.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { CapabilityTokens } from "../capabilities/tokens.ts";
import { invocationOf } from "./invocation.ts";
import type { MountedRoute } from "./mount.ts";
import type { WorkerClient } from "./client.ts";

function responseOf(reply: Reply): Response {
  if (reply.failure) {
    console.error(`[worker-invoke] ${reply.failure.code}: ${reply.failure.message}`);
    return ServerResponse.unexpected();
  }

  return new Response(reply.body.byteLength > 0 ? (reply.body as BodyInit) : null, {
    status: reply.status,
    headers: reply.headers,
  });
}

/**
 * Answers a call on `mounted`, once the caller cleared access, the quota and the permissions.
 *
 * @remarks
 * The quota is answered before the permissions, which is both the order {@link ApiEndpoint} uses
 * and the only one that means anything. The other way round, a caller already over its quota was
 * still told whether it holds the permission: the refusal it had earned was computed, its token
 * spent, and then dropped for a more informative one. Probing what a route requires was therefore
 * free however tight the limit was, which is the one thing the limit was there to prevent.
 */
export async function serve(mounted: MountedRoute, client: WorkerClient, c: Context): Future<Response> {
  const { route } = mounted;

  const [allowed, withinLimit] = await Promise.all([
    isAllowed(mounted.access, route.webhookVerified),
    withinRateLimit(route.rateLimitKey, mounted.limit),
  ]);

  if (!allowed) return ServerResponse.unauthorized();
  if (!withinLimit) return ServerResponse.tooManyRequests();

  if (route.requiredPermissions.length > 0 && !(await RbacIdentity.grants(route.requiredPermissions))) {
    return ServerResponse.forbidden({
      code: "not_permitted",
      message: "You do not have the required permission to perform this action.",
    });
  }

  const traceId = crypto.randomUUID();
  const token = CapabilityTokens.issue({
    request: RequestScope.get(),
    bodyBytes: request.bytes() ?? new Uint8Array(),
    identity: currentIdentity(),
    traceId,
    invocationId: "",
  });

  try {
    const invocation = await invocationOf(route, c.req.param(), token, traceId);
    return responseOf(await client.invoke(invocation));
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error(`[worker-invoke] ${route.routeId} failed: ${message}`);
    return ServerResponse.serviceUnavailable();
  } finally {
    CapabilityTokens.revoke(token);
  }
}
