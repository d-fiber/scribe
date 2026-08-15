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

import {
  canEditRole,
  canGrantPermissions,
  canGrantRole,
  canManageMember,
  isOwnRole,
  memberAuthority,
} from "@scribe/host/api/public/admin/src/team/_authority.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import type { InstalledMock } from "@scribe/core/testing/install.ts";
import { RequestIdentityCache } from "@scribe/core/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { assert, assertEquals, assertFalse } from "@std/assert";
import { Hono } from "hono";

const OWNER_PERMISSIONS = [
  "team:read",
  "team:create",
  "team:update",
  "team:delete",
  "role:read",
  "role:create",
  "role:update",
  "role:delete",
];
const MANAGER_PERMISSIONS = ["team:read", "team:update"];
const VIEWER_PERMISSIONS = ["team:read"];

function rolePermissionRows() {
  return [
    ...OWNER_PERMISSIONS.map((permission) => ({ role: "owner", permission })),
    ...MANAGER_PERMISSIONS.map((permission) => ({ role: "manager", permission })),
    ...VIEWER_PERMISSIONS.map((permission) => ({ role: "viewer", permission })),
  ];
}

function adminRows() {
  return [
    { admin_id: "owner-1", role: "owner", email: "owner@example.com" },
    { admin_id: "manager-1", role: "manager", email: "manager@example.com" },
    { admin_id: "viewer-1", role: "viewer", email: "viewer@example.com" },
  ];
}

function seed(): InstalledMock {
  return installRestMock({
    internal_t__admin_users: adminRows(),
    internal_t__admin_users_role_permissions: rolePermissionRows(),
  });
}

function asAdmin<T>(
  id: string,
  role: string,
  permissions: string[],
  run: () => Promise<T>,
): Promise<T> {
  const request = new Request("http://admin.test/", {
    headers: { "x-real-ip": "10.8.0.5" },
  });

  return RequestScope.run(request, new Uint8Array(0), async () => {
    await RequestIdentityCache.remember(() =>
      Promise.resolve({
        id,
        email: `${id}@example.com`,
        rules: { role, permissions },
      })
    );
    return await run();
  }, "127.0.0.1");
}

const asOwner = <T>(run: () => Promise<T>) => asAdmin("owner-1", "owner", OWNER_PERMISSIONS, run);
const asManager = <T>(run: () => Promise<T>) => asAdmin("manager-1", "manager", MANAGER_PERMISSIONS, run);

Deno.test("canGrantRole: a role within your own permissions can be granted", async () => {
  const rest = seed();
  try {
    assert(await asOwner(() => canGrantRole("manager")));
    assert(await asManager(() => canGrantRole("viewer")));
  } finally {
    rest.restore();
  }
});

Deno.test("canGrantRole: a role that exceeds your permissions is refused", async () => {
  const rest = seed();
  try {
    assertFalse(
      await asManager(() => canGrantRole("owner")),
      "granting owner would hand out role:delete, which a manager does not hold",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("canGrantRole: your own role is grantable, it is exactly your set", async () => {
  const rest = seed();
  try {
    assert(await asManager(() => canGrantRole("manager")));
  } finally {
    rest.restore();
  }
});

Deno.test("canGrantRole: an unknown role carries no permission and slips through", async () => {
  const rest = seed();
  try {
    assert(
      await asManager(() => canGrantRole("ghost")),
      "an unknown role has an empty permission set, so the authority check alone cannot reject it: every caller pairs it with an existence check",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("canGrantPermissions: a subset passes, a superset does not", async () => {
  const rest = seed();
  try {
    assert(await asManager(() => canGrantPermissions(["team:read"])));
    assert(await asManager(() => canGrantPermissions([])));
    assertFalse(await asManager(() => canGrantPermissions(["role:delete"])));
    assertFalse(
      await asManager(() => canGrantPermissions(["team:read", "role:delete"])),
      "one permission outside the caller's own set is enough to refuse the whole grant",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("canGrantPermissions: an unknown permission is never within authority", async () => {
  const rest = seed();
  try {
    assertFalse(await asOwner(() => canGrantPermissions(["team:*"])));
    assertFalse(await asOwner(() => canGrantPermissions(["invented"])));
  } finally {
    rest.restore();
  }
});

Deno.test("canEditRole: editing is bounded by the target role, not by the new content", async () => {
  const rest = seed();
  try {
    assert(await asOwner(() => canEditRole("manager")));
    assertFalse(await asManager(() => canEditRole("owner")));
  } finally {
    rest.restore();
  }
});

Deno.test("isOwnRole: compares against the caller's live role", async () => {
  const rest = seed();
  try {
    assert(await asManager(() => isOwnRole("manager")));
    assertFalse(await asManager(() => isOwnRole("owner")));
    assertFalse(await asManager(() => isOwnRole("MANAGER")));
  } finally {
    rest.restore();
  }
});

Deno.test("canManageMember: acting on a weaker member is allowed", async () => {
  const rest = seed();
  try {
    assert(await asOwner(() => canManageMember("manager-1")));
    assert(await asManager(() => canManageMember("viewer-1")));
  } finally {
    rest.restore();
  }
});

Deno.test("canManageMember: acting on a stronger member is refused", async () => {
  const rest = seed();
  try {
    assertFalse(
      await asManager(() => canManageMember("owner-1")),
      "a manager must never be able to reset an owner's password or delete them",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("canManageMember: an unknown member is refused", async () => {
  const rest = seed();
  try {
    assertFalse(await asOwner(() => canManageMember("ghost-1")));
    assertFalse(await asOwner(() => canManageMember("")));
  } finally {
    rest.restore();
  }
});

Deno.test("memberAuthority: the middleware turns the check into a 403", async () => {
  const rest = seed();
  const app = new Hono();
  app.delete("/:adminId", memberAuthority(), (c) => c.json({ reached: true }));

  try {
    const allowed = await asManager(async () => {
      const request = new Request("http://admin.test/viewer-1", {
        method: "DELETE",
      });
      return (await app.fetch(request)).status;
    });
    const refused = await asManager(async () => {
      const request = new Request("http://admin.test/owner-1", {
        method: "DELETE",
      });
      return (await app.fetch(request)).status;
    });

    assertEquals(allowed, 200);
    assertEquals(refused, 403);
  } finally {
    rest.restore();
  }
});
