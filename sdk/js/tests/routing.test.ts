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

import { assertEquals, assertThrows } from "@std/assert";
import {
  Caller,
  Delete,
  type DiscoveredRoute,
  Get,
  type InvocationContext,
  Middleware,
  Node,
  NodeRoot,
  Post,
  PROTOCOL_VERSION,
  type RateLimiter,
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
    return this.response.ok();
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
    return this.response.ok();
  }
}

class UpdateBranch extends Middleware {
  protected override permissions(): readonly string[] {
    return ["brand:update"];
  }

  protected override wrap(handler: RouteHandler): RouteHandler {
    return async (ctx: InvocationContext) => {
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
    return this.response.ok();
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
  return new ScribeServer({ routes }).addNode(
    new Node({ name: "app", public: true, node: new AppNode() }),
  );
}

Deno.test("one file answers as many methods as it declares classes", () => {
  const definition = serverWith([
    route({ path: "/brand/:brandId", module: { ReadBrand, DeleteBrand } }),
  ]).definition();

  assertEquals(definition.routes.map((entry) => entry.routeId), [
    "app:get:/brand/:brandId",
    "app:delete:/brand/:brandId",
  ]);
});

Deno.test("a route inherits the access and the rate limit of its node", () => {
  const definition = serverWith([route({ module: { ReadBrand } })]).definition();
  const [entry] = definition.routes;

  assertEquals(entry.route.access, Caller.User);
  assertEquals(entry.route.rateLimit.limit, 120);
});

Deno.test("the closest declaration wins on the rate limit", () => {
  const definition = serverWith([route({ module: { DeleteBrand } })]).definition();

  assertEquals(definition.routes[0].route.rateLimit.limit, 30);
});

Deno.test("permissions accumulate down the tree instead of replacing each other", () => {
  const definition = serverWith([
    route({
      path: "/brand/:brandId/update/name",
      module: { UpdateName },
      branches: [{ UpdateBranch }],
    }),
  ]).definition();

  assertEquals(definition.routes[0].route.requiredPermissions, ["brand:update", "brand:name"]);
});

Deno.test("a branch wraps every handler below it", async () => {
  const definition = serverWith([
    route({ path: "/brand/:brandId/update/name", module: { UpdateName }, branches: [{ UpdateBranch }] }),
  ]).definition();

  const response = await definition.routes[0].route.handler({} as InvocationContext);

  assertEquals(response.headers.get("x-wrapped"), "branch");
});

Deno.test("the rate limit key is derived from the path when nobody names it", () => {
  const definition = serverWith([route({ module: { ReadBrand } })]).definition();

  assertEquals(definition.routes[0].route.rateLimitKey, "app:get:/brand");
});

Deno.test("a file declaring the same method twice is refused", () => {
  class OtherRead extends Get {
    protected override run(): Response {
      return this.response.ok();
    }
  }

  assertThrows(
    () => serverWith([route({ module: { ReadBrand, OtherRead } })]).definition(),
    RoutingError,
    "declares GET twice",
  );
});

Deno.test("a route nobody grants access to is refused instead of served open", () => {
  const server = new ScribeServer({ routes: [route({ node: "partners", module: { ReadBrand } })] })
    .addNode(new Node({ name: "partners", public: true }));

  assertThrows(() => server.definition(), RoutingError, "without any access");
});

Deno.test("a folder no addNode declares is never served", () => {
  const server = new ScribeServer({ routes: [route({ node: "example", module: { ReadBrand } })] })
    .addNode(new Node({ name: "app", public: true }));

  assertThrows(() => server.definition(), RoutingError, "no addNode() declares");
});

Deno.test("a standard node carries its caller without any root class", () => {
  const definition = new ScribeServer({
    routes: [route({ node: "admin", branches: [{ Browsing }], module: { ReadBrand } })],
  }).addNode(new Node({ name: "admin", public: true })).definition();

  assertEquals(definition.routes[0].route.access, Caller.Admin);
});

Deno.test("the declared visibility is the one that reaches the manifest", () => {
  const definition = new ScribeServer({
    routes: [route({ node: "admin", branches: [{ Browsing }], module: { ReadBrand } })],
  }).addNode(new Node({ name: "admin", public: false })).definition();

  assertEquals(definition.nodes.map((node) => [node.name, node.public]), [["admin", false]]);
});

Deno.test("a node named after a folder that does not exist is refused", () => {
  const server = new ScribeServer({ routes: [], nodes: ["app"] })
    .addNode(new Node({ name: "admin", public: true }));

  assertThrows(() => server.definition(), RoutingError, "no admin/ folder exists");
});

Deno.test("a declared node reaches the manifest even with no route of its own", () => {
  const definition = new ScribeServer({ nodes: ["admin"] })
    .addNode(new Node({ name: "admin", public: true }))
    .definition();

  assertEquals(definition.nodes.map((node) => node.name), ["admin"]);
  assertEquals(definition.routes, []);
});

Deno.test("addNode still overrides the standard node it shadows", () => {
  class Elevated extends NodeRoot {
    protected override access(): Caller {
      return Caller.Admin;
    }

    protected override rateLimit(): RateLimiter {
      return BROWSING;
    }
  }

  const definition = new ScribeServer({ routes: [route({ module: { ReadBrand } })] })
    .addNode(new Node({ name: "app", public: false, node: new Elevated() }))
    .definition();

  assertEquals(definition.routes[0].route.access, Caller.Admin);
  assertEquals(definition.nodes[0].public, false);
});

Deno.test("the same node declared twice on the server is refused", () => {
  const server = serverWith([]);

  assertThrows(
    () => server.addNode(new Node({ name: "app", public: true, node: new AppNode() })),
    RoutingError,
    "declared twice",
  );
});

Deno.test("the manifest carries the nodes and their visibility", () => {
  const server = new ScribeServer({ routes: [route({ module: { ReadBrand } })] })
    .addNode(new Node({ name: "app", public: true, node: new AppNode() }))
    .addNode(new Node({ name: "services", public: false, node: new AppNode() }));

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
