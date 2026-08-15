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

import { assertEquals, assertRejects } from "@std/assert";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import {
  CapabilityTokens,
  UnknownCapabilityToken,
} from "@scribe/host/project/worker/capability_tokens.ts";

const ADMIN = { id: "admin-1", email: "admin@example.com", rules: { role: "owner", permissions: [] } };

function grant() {
  return {
    request: new Request("https://api.example.com/admin/brand?page=2", {
      headers: { "user-agent": "conformance" },
    }),
    bodyBytes: new TextEncoder().encode(`{"name":"Fiber"}`),
    identity: ADMIN,
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

  assertEquals(seen.id, "admin-1");
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
