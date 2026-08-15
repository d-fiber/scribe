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

import { refuseSelf } from "@scribe/host/api/public/admin/src/team/_authority.ts";
import { RequestIdentityCache } from "@scribe/core/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { assertEquals } from "@std/assert";
import { Hono } from "hono";

const SELF = "admin-self";
const OTHER = "admin-other";

function appWithGuard(): Hono {
  const app = new Hono();
  app.delete("/:adminId", refuseSelf(), (c) => c.json({ reached: true }));
  return app;
}

async function callAs(callerId: string, targetId: string) {
  const request = new Request(`http://admin.test/${targetId}`, {
    method: "DELETE",
    headers: { "x-real-ip": "1.2.3.4", authorization: "Bearer token" },
  });

  return await RequestScope.run(request, new Uint8Array(0), async () => {
    await RequestIdentityCache.remember(() =>
      Promise.resolve({
        id: callerId,
        email: `${callerId}@example.com`,
        rules: { role: "owner", permissions: [] },
      })
    );
    const response = await appWithGuard().fetch(request);
    return { status: response.status, body: await response.json() };
  }, "127.0.0.1");
}

Deno.test("refuseSelf: acting on your own account is a 403", async () => {
  const res = await callAs(SELF, SELF);

  assertEquals(res.status, 403);
  assertEquals(res.body.code, "own_account");
});

Deno.test("refuseSelf: acting on another account goes through", async () => {
  const res = await callAs(SELF, OTHER);

  assertEquals(res.status, 200);
  assertEquals(res.body.reached, true);
});

Deno.test(
  "refuseSelf: memberAuthority alone would let self-deletion pass",
  async () => {
    const res = await callAs(SELF, SELF);

    assertEquals(
      res.status,
      403,
      "canManageMember() compares the target's role permissions to the caller's own: for oneself that is always satisfied, so the authority middleware never blocked self-deletion",
    );
  },
);
