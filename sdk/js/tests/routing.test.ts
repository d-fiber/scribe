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
import { assertEquals, assertThrows } from "@std/assert";
import {
  Caller,
  Delete,
  type DiscoveredRoute,
  Get,
  Middleware,
  NodeRoot,
  Post,
  PROTOCOL_VERSION,
  type RateLimiter,
  type RequestContext,
  response,
  type RouteHandler,
  RoutingError,
  ScribeServer,
  Time,
} from "../mod.ts";
import { Caller as ProtoCaller, Method as ProtoMethod } from "../gen/scribe/protocol/common_pb.ts";
import { describeWorker } from "../mod.ts";

const BROWSING: RateLimiter = { limit: 120, window: Time.minutes(5), penalty: Time.minutes(1) };

const EDITING: RateLimiter = { limit: 30, window: Time.minutes(5), penalty: Time.minutes(5) };

class AppNode extends NodeRoot {
  protected override access(): Caller {
    return Caller.User;
  }

  protected override rateLimit(): RateLimiter {
    return BROWSING;
  }
}

class Browsing extends Middleware {
  protected override rateLimit(): RateLimiter {
    return BROWSING;
  }
}

class ReadBrand extends Get {
  protected override run(): Response {
    return response.ok();
  }
}

class DeleteBrand extends Delete {
  protected override permissions(): readonly string[] {
    return ["brand:delete"];
  }

  protected override rateLimit(): RateLimiter {
    return EDITING;
  }

  protected override run(): Response {
    return response.ok();
  }
}

class UpdateBranch extends Middleware {
  protected override permissions(): readonly string[] {
    return ["brand:update"];
  }

  protected override wrap(handler: RouteHandler): RouteHandler {
    return async (ctx: RequestContext) => {
      const response = await handler(ctx);
      response.headers.set("x-wrapped", "branch");
      return response;
    };
  }
}

class UpdateName extends Post {
  protected override permissions(): readonly string[] {
    return ["brand:name"];
  }

  protected override run(): Response {
    return response.ok();
  }
}

function route(overrides: Partial<DiscoveredRoute>): DiscoveredRoute {
  return {
    node: "app",
    path: "/brand",
    file: "lib/src/app/brand/index.ts",
    module: {},
    branches: [],
    ...overrides,
  };
}

function serverWith(routes: readonly DiscoveredRoute[]): ScribeServer {
  return new ScribeServer({ routes, nodes: [{ name: "app", public: true, root: new AppNode() }] });
}

Scribe.test("one file answers as many methods as it declares classes", () => {
  const definition = serverWith([
    route({ path: "/brand/:brandId", module: { ReadBrand, DeleteBrand } }),
  ]).definition();

  assertEquals(definition.routes.map((entry) => entry.routeId), [
    "app:get:/brand/:brandId",
    "app:delete:/brand/:brandId",
  ]);
});

Scribe.test("a route inherits the access and the rate limit of its node", () => {
  const definition = serverWith([route({ module: { ReadBrand } })]).definition();
  const [entry] = definition.routes;

  assertEquals(entry.route.access, Caller.User);
  assertEquals(entry.route.rateLimit.limit, 120);
});

Scribe.test("the closest declaration wins on the rate limit", () => {
  const definition = serverWith([route({ module: { DeleteBrand } })]).definition();

  assertEquals(definition.routes[0].route.rateLimit.limit, 30);
});

Scribe.test("permissions accumulate down the tree instead of replacing each other", () => {
  const definition = serverWith([
    route({
      path: "/brand/:brandId/update/name",
      module: { UpdateName },
      branches: [{ UpdateBranch }],
    }),
  ]).definition();

  assertEquals(definition.routes[0].route.requiredPermissions, ["brand:update", "brand:name"]);
});

Scribe.test("a branch wraps every handler below it", async () => {
  const definition = serverWith([
    route({ path: "/brand/:brandId/update/name", module: { UpdateName }, branches: [{ UpdateBranch }] }),
  ]).definition();

  const response = await definition.routes[0].route.handler({} as RequestContext);

  assertEquals(response.headers.get("x-wrapped"), "branch");
});

Scribe.test("the rate limit key is derived from the path when nobody names it", () => {
  const definition = serverWith([route({ module: { ReadBrand } })]).definition();

  assertEquals(definition.routes[0].route.rateLimitKey, "app:get:/brand");
});

Scribe.test("a file declaring the same method twice is refused", () => {
  class OtherRead extends Get {
    protected override run(): Response {
      return response.ok();
    }
  }

  assertThrows(
    () => serverWith([route({ module: { ReadBrand, OtherRead } })]).definition(),
    RoutingError,
    "declares GET twice",
  );
});

Scribe.test("a route nobody grants access to is refused instead of served open", () => {
  const server = new ScribeServer({
    routes: [route({ node: "partners", module: { ReadBrand } })],
    nodes: [{ name: "partners", public: true }],
  });

  assertThrows(() => server.definition(), RoutingError, "without any access");
});

Scribe.test("a folder config.yaml declares no node for is never served", () => {
  const server = new ScribeServer({
    routes: [route({ node: "example", module: { ReadBrand } })],
    nodes: [{ name: "app", public: true }],
  });

  assertThrows(() => server.definition(), RoutingError, "config.yaml declares no node for");
});

Scribe.test("a standard node carries its caller without any root class", () => {
  const definition = new ScribeServer({
    routes: [route({ node: "admin", branches: [{ Browsing }], module: { ReadBrand } })],
    nodes: [{ name: "admin", public: true }],
  }).definition();

  assertEquals(definition.routes[0].route.access, Caller.Admin);
});

Scribe.test("the declared visibility is the one that reaches the manifest", () => {
  const definition = new ScribeServer({
    routes: [route({ node: "admin", branches: [{ Browsing }], module: { ReadBrand } })],
    nodes: [{ name: "admin", public: false }],
  }).definition();

  assertEquals(definition.nodes.map((node) => [node.name, node.public]), [["admin", false]]);
});

Scribe.test("a declared node reaches the manifest even with no route of its own", () => {
  const definition = new ScribeServer({ nodes: [{ name: "admin", public: true }] })
    .definition();

  assertEquals(definition.nodes.map((node) => node.name), ["admin"]);
  assertEquals(definition.routes, []);
});

Scribe.test("a declared node carries the root it was given", () => {
  class Elevated extends NodeRoot {
    protected override access(): Caller {
      return Caller.Admin;
    }

    protected override rateLimit(): RateLimiter {
      return BROWSING;
    }
  }

  const definition = new ScribeServer({
    routes: [route({ module: { ReadBrand } })],
    nodes: [{ name: "app", public: false, root: new Elevated() }],
  })
    .definition();

  assertEquals(definition.routes[0].route.access, Caller.Admin);
  assertEquals(definition.nodes[0].public, false);
});

Scribe.test("the manifest carries the nodes and their visibility", () => {
  const server = new ScribeServer({
    routes: [route({ module: { ReadBrand } })],
    nodes: [{ name: "app", public: true, root: new AppNode() }, {
      name: "services",
      public: false,
      root: new AppNode(),
    }],
  });

  const manifest = describeWorker(server.definition());

  assertEquals(manifest.protocolVersion, PROTOCOL_VERSION);
  assertEquals(manifest.nodes.map((node) => [node.name, node.public]), [
    ["app", true],
    ["services", false],
  ]);
  assertEquals(manifest.routes[0].node, "app");
  assertEquals(manifest.routes[0].method, ProtoMethod.GET);
  assertEquals(manifest.routes[0].access, [ProtoCaller.USER]);
});
