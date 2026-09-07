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
import {
  contains,
  equals,
  expect,
  having,
  isA,
  isFalse,
  isNotNull,
  isNull,
  isTrue,
  Scribe,
  throwsA,
} from "@scribe/alchemy/test";
import { Node, Servers, standardContribution, standardNode, standardNodeNames } from "@scribe/alchemy/server";
import { type Caller, Middleware, type NodeRoot, type RateLimit } from "@scribe/alchemy/route";
import { Duration } from "@scribe/alchemy";

class Throttled extends Middleware {
  protected override rateLimit(): RateLimit {
    return { limit: 30, window: Duration.minutes(1), penalty: Duration.minutes(1) };
  }
}

class Signed extends Middleware {
  protected override access(): Caller {
    return "authenticated";
  }
}

class NamedRoot extends Middleware implements NodeRoot {
  protected override access(): Caller {
    return "service";
  }
}

Scribe.test("a node says what it is called and whether it is public", () => {
  const node = new Node({ name: "app", public: true, description: "What the mobile app calls." });

  expect(node.name, equals("app"));
  expect(node.public, isTrue, "a node declared public says it is not");
  expect(node.description, equals("What the mobile app calls."));
});

Scribe.test("a node that says nothing about itself describes nothing rather than empty text", () => {
  expect(new Node({ name: "app", public: false }).description, equals(null));
  expect(new Node({ name: "app", public: false }).public, isFalse, "a node declared private says it is public");
});

Scribe.test("a node the framework knows carries what the framework decided, before anything else", () => {
  const layers = new Node({ name: "app", public: true }).layers();

  expect(layers.length, equals(1), "a standard node did not carry the framework's own layer");
  expect(layers[0].access, equals("authenticated"));
});

Scribe.test("a node the framework does not know carries nothing until it says so", () => {
  expect(new Node({ name: "favorites", public: true }).layers().length, equals(0));
});

Scribe.test("every middleware becomes a layer, after the one the framework decided", () => {
  const node = new Node({ name: "app", public: true, middleware: [new Throttled(), new Signed()] });

  const layers = node.layers();

  expect(layers.length, equals(3));
  expect(layers[1].rateLimit?.limit, equals(30));
  expect(layers[2].access, equals("authenticated"));
});

Scribe.test("the five nodes the framework mounts are the five it knows", () => {
  expect(standardNodeNames(), equals(["public", "app", "admin", "services", "webhook"]));
  expect(standardNode("app")?.caller, equals("authenticated"));
  expect(standardNode("favorites"), equals(null));
});

Scribe.test("nothing listens until the host says what listens", () => {
  expect(() => Servers.get(), throwsA(having(isA(Error), (raised) => raised.message, "message", contains("Servers"))));
});

Scribe.test("a node's own root sits after every middleware, closest to the routes", () => {
  const node = new Node({
    name: "app",
    public: true,
    middleware: [new Throttled(), new Signed()],
    node: new NamedRoot(),
  });

  const layers = node.layers();

  expect(
    layers.length,
    equals(4),
    "the framework's layer, both middlewares and the node's own root did not all appear",
  );
  expect(layers[0].access, equals("authenticated"), "the framework's own layer was not first");
  expect(layers[1].rateLimit?.limit, equals(30), "the first declared middleware was not second");
  expect(layers[2].access, equals("authenticated"), "the second declared middleware was not third");
  expect(layers[3].access, equals("service"), "the node's own root did not end up last");
});

Scribe.test("a node whose root is its only declaration still carries it after the framework's own layer", () => {
  const layers = new Node({ name: "public", public: true, node: new NamedRoot() }).layers();

  expect(layers.length, equals(2));
  expect(layers[0].access, equals("anonymous"), "the public node's own meaning was not carried first");
  expect(layers[1].access, equals("service"), "the node's own root was not carried after it");
});

Scribe.test("the webhook node requires a checked signature and answers as webhook, with no default rate limit", () => {
  const webhook = standardNode("webhook");
  expect(webhook, isNotNull, "the webhook node is one of the five the framework knows");

  const layer = standardContribution(webhook!);
  expect(layer.access, equals("webhook"));
  expect(layer.webhookVerified, isTrue, "the webhook node did not require a checked signature");
  expect(layer.rateLimit, isNull, "a standard node handed out a rate limit nobody asked for");
});

Scribe.test("the services node answers as service and says nothing about a signature", () => {
  const services = standardNode("services");
  expect(services, isNotNull, "the services node is one of the five the framework knows");

  const layer = standardContribution(services!);
  expect(layer.access, equals("service"));
  expect(layer.webhookVerified, isNull, "the services node said something about a signature it never promised");
  expect(services!.public, isFalse, "the services node is reachable from outside the deployment");
});
