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

import { contains, equals, expect, having, isA, isFalse, isTrue, throwsA } from "@scribe/alchemy/test/mod.ts";
import { compileNode, RoutingError } from "@scribe/alchemy/api/route/mount/tree.ts";
import type { DiscoveredRoute } from "@scribe/alchemy/api/route/mount/discovery.ts";
import type { Contribution } from "@scribe/alchemy/api/route/mount/contribution.ts";
import { NOTHING } from "@scribe/alchemy/api/route/mount/contribution.ts";
import {
  type Caller,
  Get,
  InvocationContext,
  type Invoked,
  Middleware,
  Post,
  type RateLimit,
} from "@scribe/alchemy/api/route/mod.ts";
import { Duration } from "@scribe/alchemy/mod.ts";

const CALL: Invoked = {
  invocationId: "call-1",
  traceId: "trace-1",
  user: null,
  method: "GET",
  path: "/brands",
  ip: "127.0.0.1",
  userAgent: "",
  sessionId: null,
  pathParams: {},
  query: {},
  headers: {},
  body: null,
  device: null,
  location: null,
};

const EVERY_MINUTE: RateLimit = { limit: 30, window: Duration.minutes(1), penalty: Duration.minutes(1) };

class Reader extends Get {
  protected override run(): Response {
    return this.response.ok();
  }
}

class OpenReader extends Get {
  protected override access(): Caller {
    return "anonymous";
  }

  protected override run(): Response {
    return this.response.ok();
  }
}

class UnsignedReader extends Get {
  protected override webhookVerified(): boolean {
    return false;
  }

  protected override run(): Response {
    return this.response.ok();
  }
}

class AdminRoot extends Middleware {
  protected override access(): Caller {
    return "authenticated";
  }

  protected override rateLimit(): RateLimit {
    return EVERY_MINUTE;
  }

  protected override webhookVerified(): boolean {
    return true;
  }
}

function found(module: Record<string, unknown>, branches: Record<string, unknown>[] = []): DiscoveredRoute {
  return { node: "admin", path: "/brands", file: "lib/admin/brands/index.ts", module, branches };
}

const NODE_SAYS_EVERYTHING: Contribution = {
  ...NOTHING,
  access: "authenticated",
  rateLimit: EVERY_MINUTE,
  webhookVerified: false,
};

Deno.test("a route may not answer a caller the middleware above it refused", () => {
  expect(
    () => compileNode("admin", [], [found({ default: OpenReader }, [{ default: AdminRoot }])]),
    throwsA(isA(RoutingError)),
    "a leaf reopened a node the root had closed",
  );
});

Deno.test("the refusal names the file and says a route narrows rather than widens", () => {
  expect(
    () => compileNode("admin", [], [found({ default: OpenReader }, [{ default: AdminRoot }])]),
    throwsA(having(isA(RoutingError), (raised) => raised.message, "message", contains("lib/admin/brands/index.ts"))),
  );
});

Deno.test("a route under a closed node inherits what the node allows", () => {
  const compiled = compileNode("admin", [], [found({ default: Reader }, [{ default: AdminRoot }])]);

  expect(compiled.length, equals(1));
  expect(compiled[0].route.access, equals(["authenticated"]));
});

Deno.test("a node that answered for the whole tree spares every route beneath it the declaration", () => {
  const compiled = compileNode("admin", [NODE_SAYS_EVERYTHING], [found({ default: Reader })]);

  expect(compiled.length, equals(1));
  expect(compiled[0].route.webhookVerified, isFalse);
});

Deno.test("nothing anywhere says whether a signature is checked, and the node will not compile", () => {
  expect(
    () =>
      compileNode("admin", [{ ...NOTHING, access: "authenticated", rateLimit: EVERY_MINUTE }], [found({
        default: Reader,
      })]),
    throwsA(having(isA(RoutingError), (raised) => raised.message, "message", contains("webhookVerified"))),
  );
});

Deno.test("a route says out loud that no signature is checked, and compiles", () => {
  const compiled = compileNode(
    "admin",
    [{ ...NOTHING, access: "authenticated", rateLimit: EVERY_MINUTE }],
    [found({ default: UnsignedReader })],
  );

  expect(compiled[0].route.webhookVerified, isFalse);
});

Deno.test("a signature the root requires is not lifted by the route beneath it", () => {
  const compiled = compileNode("admin", [], [found({ default: UnsignedReader }, [{ default: AdminRoot }])]);

  expect(compiled[0].route.webhookVerified, isTrue, "the route lifted the check its root required");
});

Deno.test("a file that re-exports a base mounts the route it wrote, and no other", () => {
  const compiled = compileNode("admin", [NODE_SAYS_EVERYTHING], [found({ default: Reader, Get, Post })]);

  expect(compiled.length, equals(1), "a re-exported base was mounted as a route of its own");
  expect(compiled[0].route.method, equals("get"));
});

Deno.test("a re-exported base never becomes a route that answers nothing", async () => {
  const compiled = compileNode("admin", [NODE_SAYS_EVERYTHING], [found({ default: Reader, Get })]);
  const answered = await compiled[0].route.handler(new InvocationContext(CALL));

  expect(answered.status, equals(200), "the route that was mounted had no body to run");
});
