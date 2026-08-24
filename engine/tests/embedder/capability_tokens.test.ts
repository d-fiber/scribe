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

import type { RequestUser } from "@scribe/alchemy/route";
import { assertEquals, assertRejects } from "@std/assert";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { CapabilityTokens, UnknownCapabilityToken } from "@scribe/engine/embedder/capabilities/tokens.ts";

const CALLER: RequestUser = { id: "caller-1", caller: "authenticated", role: "owner", permissions: [], claims: {} };

function grant() {
  return {
    request: new Request("https://api.example.com/admin/brand?page=2", {
      headers: { "user-agent": "conformance" },
    }),
    bodyBytes: new TextEncoder().encode(`{"name":"Fiber"}`),
    identity: CALLER,
    traceId: "trace-1",
    invocationId: "inv-1",
  };
}

Deno.test("a capability token replays the identity of the invocation that issued it", async () => {
  const token = CapabilityTokens.issue(grant());

  const seen = await CapabilityTokens.run(token, () =>
    Promise.resolve({
      id: currentIdentity()?.id,
      path: request.path(),
      agent: request.userAgent(),
    }));

  assertEquals(seen.id, "caller-1");
  assertEquals(seen.path, "/admin/brand");
  assertEquals(seen.agent, "conformance");

  CapabilityTokens.revoke(token);
});

Deno.test("a revoked token cannot be replayed once the invocation is over", async () => {
  const token = CapabilityTokens.issue(grant());
  CapabilityTokens.revoke(token);

  await assertRejects(
    () => CapabilityTokens.run(token, () => Promise.resolve(null)),
    UnknownCapabilityToken,
  );
});

Deno.test("a token the host never issued is refused", async () => {
  await assertRejects(
    () => CapabilityTokens.run("forged", () => Promise.resolve(null)),
    UnknownCapabilityToken,
  );
});

Deno.test("an expired token is swept instead of lingering", () => {
  const token = CapabilityTokens.issue(grant(), -1);

  assertEquals(CapabilityTokens.redeem(token), null);
});
