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

import "@scribe/scholium/runner.ts";
import { equals, expect, Scribe } from "@scribe/alchemy/test";
import type { WorkerRoute } from "@scribe/alchemy/route";
import { mountedRoute, routeIdOf, routingKeyOf } from "@scribe/alchemy/route";
import { Duration } from "@scribe/alchemy";

function route(overrides: Partial<WorkerRoute> = {}): WorkerRoute {
  return {
    method: "get",
    path: "/brands/:id",
    access: "anonymous",
    rateLimit: { limit: 10, window: Duration.seconds(1), penalty: Duration.seconds(1) },
    rateLimitKey: "brands.show",
    handler: () => new Response(null),
    ...overrides,
  };
}

Scribe.test("routeIdOf names a route with its node, method and exact path", () => {
  const id = routeIdOf("app", route({ method: "post", path: "/brands/:id" }));
  expect(id, equals("app:post:/brands/:id"), "the route identifier did not carry the node, method and exact path");
});

Scribe.test("routeIdOf tells apart two routes that differ only by node", () => {
  const first = routeIdOf("app", route());
  const second = routeIdOf("webhook", route());
  expect(first === second, equals(false), "two different nodes produced the same route identifier");
});

Scribe.test("routeIdOf tells apart two routes that differ only by method", () => {
  const asGet = routeIdOf("app", route({ method: "get" }));
  const asDelete = routeIdOf("app", route({ method: "delete" }));
  expect(asGet === asDelete, equals(false), "two different methods produced the same route identifier");
});

Scribe.test("routingKeyOf collapses a single path parameter into a star", () => {
  const key = routingKeyOf("app", route({ path: "/brands/:id" }));
  expect(key, equals("app:get:/brands/:*"), "a single parameter was not anonymised");
});

Scribe.test("routingKeyOf collapses every parameter of a multi-parameter path", () => {
  const key = routingKeyOf("app", route({ path: "/brands/:brandId/products/:productId" }));
  expect(
    key,
    equals("app:get:/brands/:*/products/:*"),
    "not every parameter of a multi-parameter path was anonymised",
  );
});

Scribe.test("routingKeyOf leaves a path with no parameter untouched", () => {
  const key = routingKeyOf("app", route({ path: "/brands" }));
  expect(key, equals("app:get:/brands"), "a path with no parameter was changed");
});

Scribe.test("routingKeyOf merges two routes that differ only by the parameter's name", () => {
  const first = routingKeyOf("app", route({ path: "/brands/:id" }));
  const second = routingKeyOf("app", route({ path: "/brands/:brandId" }));
  expect(first, equals(second), "two routes shaped the same way produced different routing keys");
});

Scribe.test("mountedRoute carries the node, the route and the routeId routeIdOf would answer", () => {
  const worker = route({ method: "put", path: "/brands/:id" });
  const mounted = mountedRoute("app", worker);

  expect(mounted.node, equals("app"), "the node was not carried over");
  expect(mounted.route, equals(worker), "the route was not carried over as declared");
  expect(mounted.routeId, equals(routeIdOf("app", worker)), "the routeId did not match routeIdOf's own answer");
});
