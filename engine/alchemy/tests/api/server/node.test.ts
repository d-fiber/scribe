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

import { contains, equals, expect, having, isA, isFalse, isTrue, throwsA } from "../../../test/mod.ts";
import { Node, Servers, standardNode, standardNodeNames } from "../../../api/server/mod.ts";
import { type Caller, Middleware, type RateLimit } from "../../../api/route/mod.ts";
import { Duration } from "../../../mod.ts";

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

Deno.test("a node says what it is called and whether it is public", () => {
  const node = new Node({ name: "app", public: true, description: "What the mobile app calls." });

  expect(node.name, equals("app"));
  expect(node.public, isTrue, "a node declared public says it is not");
  expect(node.description, equals("What the mobile app calls."));
});

Deno.test("a node that says nothing about itself describes nothing rather than empty text", () => {
  expect(new Node({ name: "app", public: false }).description, equals(null));
  expect(new Node({ name: "app", public: false }).public, isFalse, "a node declared private says it is public");
});

Deno.test("a node the framework knows carries what the framework decided, before anything else", () => {
  const layers = new Node({ name: "app", public: true }).layers();

  expect(layers.length, equals(1), "a standard node did not carry the framework's own layer");
  expect(layers[0].access, equals("authenticated"));
});

Deno.test("a node the framework does not know carries nothing until it says so", () => {
  expect(new Node({ name: "favorites", public: true }).layers().length, equals(0));
});

Deno.test("every middleware becomes a layer, after the one the framework decided", () => {
  const node = new Node({ name: "app", public: true, middleware: [new Throttled(), new Signed()] });

  const layers = node.layers();

  expect(layers.length, equals(3));
  expect(layers[1].rateLimit?.limit, equals(30));
  expect(layers[2].access, equals("authenticated"));
});

Deno.test("the five nodes the framework mounts are the five it knows", () => {
  expect(standardNodeNames(), equals(["public", "app", "admin", "services", "webhook"]));
  expect(standardNode("app")?.caller, equals("authenticated"));
  expect(standardNode("favorites"), equals(null));
});

Deno.test("nothing listens until the host says what listens", () => {
  expect(() => Servers.get(), throwsA(having(isA(Error), (raised) => raised.message, "message", contains("Servers"))));
});
