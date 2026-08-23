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
import { Caller as ProtoCaller, Method as ProtoMethod } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import type {
  Manifest,
  NodeDeclaration,
  RateLimiter as ProtoRateLimiter,
  Route,
} from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import type { Reply } from "@scribe/sdk/gen/scribe/protocol/invocation_pb.ts";
import { Duration } from "@scribe/alchemy";
import { Caller, isAllowed } from "@scribe/core/kernel/endpoint/access.ts";
import { type RateLimiter, withinRateLimit } from "@scribe/core/kernel/endpoint/rate_limit.ts";
import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { RbacIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { CapabilityTokens } from "./capability_tokens.ts";
import { invocationOf } from "./invocation.ts";
import type { WorkerClient } from "./worker_client.ts";

type HonoMethod = "get" | "post" | "put" | "patch" | "delete";

const callers: Record<ProtoCaller, Caller> = {
  [ProtoCaller.UNSPECIFIED]: Caller.Anonymous,
  [ProtoCaller.ANONYMOUS]: Caller.Anonymous,
  [ProtoCaller.USER]: Caller.User,
  [ProtoCaller.ADMIN]: Caller.Admin,
  [ProtoCaller.SERVICE]: Caller.Service,
  [ProtoCaller.WEBHOOK]: Caller.Webhook,
};

const methods: Record<ProtoMethod, HonoMethod> = {
  [ProtoMethod.UNSPECIFIED]: "get",
  [ProtoMethod.GET]: "get",
  [ProtoMethod.POST]: "post",
  [ProtoMethod.PUT]: "put",
  [ProtoMethod.PATCH]: "patch",
  [ProtoMethod.DELETE]: "delete",
};

export type NodeResolver = (node: NodeDeclaration) => Hono;

export class NodeMountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NodeMountError";
  }
}

function limiterOf(limiter: ProtoRateLimiter | undefined): RateLimiter {
  return {
    limit: limiter?.limit ?? 0,
    window: Duration.milliseconds(Number(limiter?.window?.millis ?? 0n)),
    penalty: Duration.milliseconds(Number(limiter?.penalty?.millis ?? 0n)),
    maxPenalty: limiter?.maxPenalty ? Duration.milliseconds(Number(limiter.maxPenalty.millis)) : undefined,
  };
}

async function grantsAll(required: readonly string[]): Promise<boolean> {
  const granted = await RbacIdentity.permissions();
  return required.every((permission) => granted.includes(permission));
}

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

async function serve(route: Route, client: WorkerClient, c: Context): Promise<Response> {
  const declared = route.access.map((caller) => callers[caller] ?? Caller.Anonymous);

  // The rate limit is independent of who the caller is, so it rides alongside
  // the identity lookup rather than waiting for it. The permission check does
  // depend on the resolved identity, so it stays behind.
  const [allowed, withinLimit] = await Promise.all([
    isAllowed(declared, route.webhookVerified),
    withinRateLimit(route.rateLimitKey, limiterOf(route.rateLimit)),
  ]);

  if (!allowed) return ServerResponse.unauthorized();

  if (route.requiredPermissions.length > 0 && !(await grantsAll(route.requiredPermissions))) {
    return ServerResponse.forbidden({
      code: "not_permitted",
      message: "You do not have the required permission to perform this action.",
    });
  }

  if (!withinLimit) return ServerResponse.tooManyRequests();

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

export function mountManifest(
  resolve: NodeResolver,
  manifest: Manifest,
  client: WorkerClient,
): number {
  const apps = new Map<string, Hono>();

  for (const node of manifest.nodes) {
    if (node.name.trim() === "") {
      throw new NodeMountError("A node without a name reached the manifest.");
    }
    apps.set(node.name, resolve(node));
  }

  let mounted = 0;
  for (const route of manifest.routes) {
    const app = apps.get(route.node);
    if (!app) {
      throw new NodeMountError(
        `${route.routeId} belongs to the node "${route.node}", which the manifest never declares.`,
      );
    }

    app[methods[route.method]](route.path, (c) => serve(route, client, c));
    mounted += 1;
  }

  return mounted;
}
