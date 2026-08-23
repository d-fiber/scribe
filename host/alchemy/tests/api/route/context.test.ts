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

import { equals, expect, isFalse } from "../../../src/test/mod.ts";
import { InvocationContext, type Invoked } from "../../../src/api/route/mod.ts";
import { Required } from "../../../mod.ts";

function invoked(over: Partial<Invoked> = {}): Invoked {
  return {
    invocationId: "call-1",
    traceId: "trace-1",
    user: null,
    method: "POST",
    path: "/app/favorites/brands",
    ip: "127.0.0.1",
    userAgent: "poppin/1.0",
    sessionId: null,
    pathParams: {},
    query: {},
    headers: {},
    body: null,
    device: null,
    location: null,
    ...over,
  };
}

Deno.test("a call nobody signed answers no identity rather than an empty one", () => {
  const ctx = new InvocationContext(invoked());

  expect(ctx.id, equals(null));
  expect(ctx.user, equals(null));
});

Deno.test("the identity of a signed call is read without walking into it", () => {
  const ctx = new InvocationContext(invoked({
    user: { id: "ada", email: "ada@bench.local", caller: "authenticated", role: "member", permissions: [] },
  }));

  expect(ctx.id, equals("ada"));
  expect(ctx.user?.caller, equals("authenticated"));
});

Deno.test("a header is found whatever case it was written in", () => {
  const ctx = new InvocationContext(invoked({ headers: { "content-type": "application/json" } }));

  expect(ctx.header("Content-Type"), equals("application/json"));
  expect(ctx.header("CONTENT-TYPE"), equals("application/json"));
  expect(ctx.header("accept"), equals(null));
});

Deno.test("what the path and the query carried is read by name, and absence is null", () => {
  const ctx = new InvocationContext(invoked({ pathParams: { id: "7" }, query: { page: "2" } }));

  expect(ctx.param("id"), equals("7"));
  expect(ctx.param("missing"), equals(null));
  expect(ctx.query("page"), equals("2"));
  expect(ctx.query("missing"), equals(null));
});

Deno.test("a body is read against the shape it was declared with", () => {
  const ctx = new InvocationContext(invoked({
    body: new TextEncoder().encode(JSON.stringify({ brand_id: "b-1" })),
  }));

  expect(ctx.body({ brand_id: Required(String) })?.brand_id, equals("b-1"));
});

Deno.test("a body missing what the shape requires answers nothing, and so does one that is not JSON", () => {
  const missing = new InvocationContext(invoked({ body: new TextEncoder().encode("{}") }));
  const broken = new InvocationContext(invoked({ body: new TextEncoder().encode("{") }));

  expect(missing.body({ brand_id: Required(String) }), equals(null));
  expect(broken.body({ brand_id: Required(String) }), equals(null));
});

Deno.test("a call with no body reads as nothing rather than as an empty one", () => {
  const ctx = new InvocationContext(invoked());

  expect(ctx.body({ brand_id: Required(String) }), equals(null));
  expect(ctx.raw(), equals(null));
});

Deno.test("a place nothing resolved answers empty, so a caller never checks for null", () => {
  const ctx = new InvocationContext(invoked());

  expect(ctx.location(), equals({ city: "", country: "" }));
  expect(ctx.device(), equals(null));
});

Deno.test("nothing of the protocol reaches an endpoint: a call is plain data", () => {
  const ctx = new InvocationContext(invoked({ sessionId: "s-1" }));

  expect(ctx.sessionId, equals("s-1"));
  expect(ctx.method, equals("POST"));
  expect("invocation" in ctx, isFalse, "the context still carries a protocol message");
});
