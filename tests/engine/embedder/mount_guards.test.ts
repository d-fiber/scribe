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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import "@scribe/testing/settings.ts";
import { create } from "@bufbuild/protobuf";
import { Caller as ProtoCaller, Method as ProtoMethod } from "@scribe/sdk/gen/scribe/protocol/common_pb.ts";
import { type Manifest, ManifestSchema } from "@scribe/sdk/gen/scribe/protocol/manifest_pb.ts";
import { mountManifest, NodeMountError } from "@scribe/embedder/control/mount.ts";
import type { WorkerClient } from "@scribe/embedder/control/client.ts";
import { honoRouter } from "@scribe/kernel/http/routing/hono_router.ts";
import { RequestIdentityCache } from "@scribe/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { RateLimiters } from "@scribe/alchemy";
import type { RateLimitOutcome } from "@scribe/alchemy";
import { installValkeryMock } from "@scribe/foundation/testing";
import { assertEquals, assertThrows } from "@std/assert";
import type { Hono } from "hono";

const A_LIMIT = { limit: 1, window: { millis: 60_000n }, penalty: { millis: 60_000n } };

/** A manifest of one route on one node, with `route` laid over the nominal declaration. */
function manifestOf(route: Record<string, unknown>): Manifest {
  return create(ManifestSchema, {
    protocolVersion: "1.0.0",
    nodes: [{ name: "app", public: true }],
    routes: [{
      routeId: "app:GET:/thing",
      node: "app",
      method: ProtoMethod.GET,
      path: "/thing",
      access: [ProtoCaller.ANONYMOUS],
      rateLimitKey: "app:GET:/thing",
      rateLimit: A_LIMIT,
      ...route,
    }],
  });
}

const NEVER_INVOKED = {
  invoke: () => Promise.reject(new Error("the call must never reach the worker")),
} as unknown as WorkerClient;

/** Mounts `manifest` and answers one GET on /thing, as `caller` when there is one. */
async function answerOne(manifest: Manifest, caller: Parameters<typeof RequestIdentityCache.seed>[0]) {
  let app: Hono | null = null;
  mountManifest(() => (app = honoRouter()), manifest, NEVER_INVOKED);

  const req = new Request("http://api.test/thing");
  return await RequestScope.run(req, new Uint8Array(0), () => {
    RequestIdentityCache.seed(caller);
    return app!.fetch(req);
  }, "127.0.0.1");
}

/**
 * Puts a driver answering every hit with `outcome` in the rate limit port, and takes it back out.
 *
 * The quota verdict has to be the one thing under control here, and the fake store does not play
 * the rate limit script: reaching the real driver through it throws, falls open, and proves
 * nothing about the order the two answers are given in.
 */
function quotaAnswering(outcome: RateLimitOutcome): { restore: () => void } {
  const held = RateLimiters.configured ? RateLimiters.get() : null;

  RateLimiters.use({
    open: (options) => ({
      key: options.key,
      check: () => Promise.resolve(outcome),
      isBlocked: () => Promise.resolve(!outcome.ok),
      unmeasured: () => outcome,
    }),
  });

  return {
    restore: () => {
      if (held !== null) RateLimiters.use(held);
    },
  };
}

const OVER_QUOTA: RateLimitOutcome = { ok: false, retryAfter: 60, strikes: 1 };
const WITHIN_QUOTA: RateLimitOutcome = { ok: true, remaining: 9 };

Scribe.test("a route whose manifest declares no rate limit is refused at mount, by name", () => {
  installValkeryMock();

  const error = assertThrows(
    () => mountManifest(() => honoRouter(), manifestOf({ rateLimit: undefined }), NEVER_INVOKED),
    NodeMountError,
  );

  assertEquals(
    error.message.includes("app:GET:/thing"),
    true,
    "a limit of zero measures nothing and lets the caller through: the route was unlimited, and said so on a line per request",
  );
});

Scribe.test("a caller over its quota is told so, and not what the route requires", async () => {
  installValkeryMock();
  const limiter = quotaAnswering(OVER_QUOTA);

  try {
    const answer = await answerOne(
      manifestOf({ access: [ProtoCaller.USER], requiredPermissions: ["brand.write"] }),
      { id: "u1", caller: "authenticated", role: "", permissions: [], claims: {} },
    );

    assertEquals(
      answer.status,
      429,
      "answering the permission first made probing what a route requires free, however tight the limit was",
    );
  } finally {
    limiter.restore();
  }
});

Scribe.test("a caller inside its quota that holds nothing is still forbidden", async () => {
  installValkeryMock();
  const limiter = quotaAnswering(WITHIN_QUOTA);

  try {
    const answer = await answerOne(
      manifestOf({ access: [ProtoCaller.USER], requiredPermissions: ["brand.write"] }),
      { id: "u1", caller: "authenticated", role: "", permissions: [], claims: {} },
    );

    assertEquals(answer.status, 403, "the quota moving first must not turn a forbidden call into an allowed one");
  } finally {
    limiter.restore();
  }
});

Scribe.test("a caller that proved nothing is refused before either question is asked", async () => {
  installValkeryMock();
  const limiter = quotaAnswering(WITHIN_QUOTA);

  try {
    assertEquals((await answerOne(manifestOf({ access: [ProtoCaller.USER] }), null)).status, 401);
  } finally {
    limiter.restore();
  }
});
