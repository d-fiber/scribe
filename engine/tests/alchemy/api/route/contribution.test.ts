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

import { equals, expect, isFalse, isTrue } from "@scribe/alchemy/test/mod.ts";
import { type Contribution, merge, NOTHING } from "@scribe/alchemy/api/route/mount/contribution.ts";
import { Duration } from "@scribe/alchemy/mod.ts";

function layer(said: Partial<Contribution>): Contribution {
  return { ...NOTHING, ...said };
}

const ROOT_OF_ADMIN_NODE = layer({
  access: "authenticated",
  permissions: ["admin:all"],
  rateLimit: { limit: 5, window: Duration.minutes(1), penalty: Duration.minutes(5) },
  webhookVerified: true,
});

Deno.test("a route cannot answer a caller the layer above it did not allow", () => {
  const settled = merge([ROOT_OF_ADMIN_NODE, layer({ access: "anonymous" })]);

  expect(settled.access, equals([]), "the leaf widened what the root had closed");
});

Deno.test("a route narrows an inherited access to the callers it names", () => {
  const settled = merge([
    layer({ access: ["authenticated", "service"] }),
    layer({ access: "service" }),
  ]);

  expect(settled.access, equals(["service"]));
});

Deno.test("a route that says nothing about access keeps what the layer above allowed", () => {
  const settled = merge([ROOT_OF_ADMIN_NODE, layer({})]);

  expect(settled.access, equals(["authenticated"]));
});

Deno.test("the strictest rate limit of the layers is the one that holds", () => {
  const settled = merge([
    ROOT_OF_ADMIN_NODE,
    layer({ rateLimit: { limit: 1_000_000, window: Duration.seconds(1), penalty: Duration.milliseconds(1) } }),
  ]);

  expect(settled.rateLimit?.limit, equals(5), "the leaf raised the ceiling the root had set");
});

Deno.test("a route may lower a rate limit the layer above it set", () => {
  const settled = merge([
    ROOT_OF_ADMIN_NODE,
    layer({ rateLimit: { limit: 1, window: Duration.minutes(1), penalty: Duration.minutes(5) } }),
  ]);

  expect(settled.rateLimit?.limit, equals(1));
});

Deno.test("a layer may require a checked signature, and no layer beneath may lift it", () => {
  const settled = merge([ROOT_OF_ADMIN_NODE, layer({ webhookVerified: false })]);

  expect(settled.webhookVerified, isTrue, "the leaf lifted the signature check the root required");
});

Deno.test("a layer beneath may require a signature nothing above asked for", () => {
  const settled = merge([layer({}), layer({ webhookVerified: true })]);

  expect(settled.webhookVerified, isTrue);
});

Deno.test("nothing anywhere leaves the signature unchecked rather than deciding", () => {
  expect(merge([layer({}), layer({})]).webhookVerified, equals(null));
});

Deno.test("a permission asked higher up is kept, and the two lists gather", () => {
  const settled = merge([ROOT_OF_ADMIN_NODE, layer({ permissions: ["favorites:write"] })]);

  expect(settled.permissions, equals(["admin:all", "favorites:write"]));
});

Deno.test("merging nothing at all answers the layer that says nothing", () => {
  const settled = merge([]);

  expect(settled.access, equals(null));
  expect(settled.rateLimit, equals(null));
  expect(settled.webhookVerified, equals(null));
  expect(settled.permissions, equals([]));
  expect(isFalse.matches(settled.wrap !== null), isTrue);
});
