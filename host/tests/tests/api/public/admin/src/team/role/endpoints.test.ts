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

import { CreateRoleEndpoint } from "@scribe/host/api/public/admin/src/team/role/create.ts";
import { DeleteRoleEndpoint } from "@scribe/host/api/public/admin/src/team/role/delete.ts";
import { UpdateRoleEndpoint } from "@scribe/host/api/public/admin/src/team/role/update.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";

const ATTACKER_ID = "admin-attacker";
const VICTIM_ID = "admin-victim";

const ALL_PERMISSIONS = [
  "role:create",
  "role:read",
  "role:update",
  "role:delete",
  "team:read",
  "intra:supabase",
];

const WEAK_PERMISSIONS = ["role:create", "role:read", "role:update", "role:delete"];

function identityOf(id: string, role: string, permissions: string[]) {
  return { id, email: `${id}@example.com`, rules: { role, permissions } };
}

function signedIn(role: string, permissions: string[]) {
  return {
    identity: identityOf(ATTACKER_ID, role, permissions),
    device: fakeDevice(),
  };
}

function permissionRows() {
  return ALL_PERMISSIONS.map((permission) => ({ permission }));
}

function rolePermissionRows() {
  return [
    ...ALL_PERMISSIONS.map((permission) => ({ role: "owner", permission })),
    ...WEAK_PERMISSIONS.map((permission) => ({ role: "support", permission })),
    ...WEAK_PERMISSIONS.map((permission) => ({ role: "temp", permission })),
  ];
}

function seed() {
  return {
    internal_t__admin_users_roles: [
      { role: "owner" },
      { role: "basic" },
      { role: "support" },
      { role: "temp" },
    ],
    internal_t__admin_users_permissions: permissionRows(),
    internal_t__admin_users_role_permissions: rolePermissionRows(),
    internal_t__admin_users: [
      { admin_id: ATTACKER_ID, role: "support", updated_at: 0 },
      { admin_id: VICTIM_ID, role: "temp", updated_at: 0 },
    ],
  };
}

type Rest = ReturnType<typeof installRestMock>;

function armRpc(rest: Rest) {
  rest.onRpc("admin_role_create", (args) => {
    const role = args?.p_role as string;
    const permissions = (args?.p_permissions ?? []) as string[];
    rest.rows("internal_t__admin_users_roles").push({ role });
    for (const permission of permissions) {
      rest.rows("internal_t__admin_users_role_permissions").push({
        role,
        permission,
      });
    }
    return null;
  });

  rest.onRpc("admin_role_replace_permissions", (args) => {
    const role = args?.p_role as string;
    const permissions = (args?.p_permissions ?? []) as string[];
    const rows = rest.rows("internal_t__admin_users_role_permissions");
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i].role === role) rows.splice(i, 1);
    }
    for (const permission of permissions) rows.push({ role, permission });
    return null;
  });

  rest.onRpc("admin_role_delete", (args) => {
    const role = args?.p_role as string;
    const fallback = args?.p_fallback as string;
    const migrated: string[] = [];
    for (const admin of rest.rows("internal_t__admin_users")) {
      if (admin.role === role) {
        admin.role = fallback;
        migrated.push(admin.admin_id as string);
      }
    }
    const roles = rest.rows("internal_t__admin_users_roles");
    const at = roles.findIndex((r) => r.role === role);
    if (at !== -1) roles.splice(at, 1);
    return migrated;
  });
}

function setup() {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock(seed());
  const env = installAuthEnv();
  armRpc(rest);
  return {
    gotrue,
    rest,
    restore() {
      env.restore();
      rest.restore();
      gotrue.restore();
    },
  };
}

// --- DELETE /team/role/role ---------------------------------------------------

Deno.test(
  "DELETE role: a role outside the caller's authority cannot be deleted",
  async () => {
    const t = setup();

    try {
      const res = await callEndpoint(
        () => DeleteRoleEndpoint.handle(),
        { role: "owner" },
        signedIn("support", WEAK_PERMISSIONS),
      );

      assertEquals(res.status, 403);
      assertEquals(res.body.code, "protected_role");
      assert(
        t.rest.rows("internal_t__admin_users_roles").some((r) => r.role === "owner"),
        "owner must survive",
      );
    } finally {
      t.restore();
    }
  },
);

Deno.test("DELETE role: the fallback role itself is protected", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => DeleteRoleEndpoint.handle(),
      { role: "basic" },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(res.status, 403);
    assertEquals(res.body.code, "protected_role");
    assert(
      t.rest.rows("internal_t__admin_users_roles").some((r) => r.role === "basic"),
      "deleting the fallback would leave later deletions without a target",
    );
  } finally {
    t.restore();
  }
});

Deno.test("DELETE role: the caller cannot delete the role it holds", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => DeleteRoleEndpoint.handle(),
      { role: "support" },
      signedIn("support", WEAK_PERMISSIONS),
    );

    assertEquals(res.status, 403);
    assertEquals(res.body.code, "own_role");
    assertEquals(
      t.rest.rows("internal_t__admin_users").find((a) => a.admin_id === ATTACKER_ID)?.role,
      "support",
      "self-deletion would silently demote the caller to basic",
    );
  } finally {
    t.restore();
  }
});

Deno.test(
  "DELETE role: a role beyond the caller's permissions is refused",
  async () => {
    const t = setup();
    t.rest.rows("internal_t__admin_users_role_permissions").push({
      role: "temp",
      permission: "intra:supabase",
    });

    try {
      const res = await callEndpoint(
        () => DeleteRoleEndpoint.handle(),
        { role: "temp" },
        signedIn("support", WEAK_PERMISSIONS),
      );

      assertEquals(res.status, 403);
      assertEquals(res.body.code, "not_permitted");
      assert(
        t.rest.rows("internal_t__admin_users_roles").some((r) => r.role === "temp"),
      );
    } finally {
      t.restore();
    }
  },
);

Deno.test(
  "DELETE role: members are migrated to basic, never to a role of the caller's choosing",
  async () => {
    const t = setup();

    try {
      const res = await callEndpoint(
        () => DeleteRoleEndpoint.handle(),
        { role: "temp", migrate_to: "owner" },
        signedIn("support", WEAK_PERMISSIONS),
      );

      assertEquals(res.status, 200);
      assertEquals(
        (res.body.data as Record<string, unknown>).migrated_to,
        "basic",
      );
      assertEquals(
        t.rest.rows("internal_t__admin_users").find((a) => a.admin_id === VICTIM_ID)?.role,
        "basic",
        "a migrate_to in the body must be ignored: it was the escalation vector",
      );
      assert(
        !t.rest.rows("internal_t__admin_users_roles").some((r) => r.role === "temp"),
      );
    } finally {
      t.restore();
    }
  },
);

Deno.test("DELETE role: an unknown role is a 404", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => DeleteRoleEndpoint.handle(),
      { role: "ghost" },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(res.status, 404);
  } finally {
    t.restore();
  }
});

Deno.test("DELETE role: the role name is normalised before every check", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => DeleteRoleEndpoint.handle(),
      { role: "  OWNER  " },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(
      res.status,
      403,
      "without normalisation the protected-role check reads a different string than the lookup",
    );
    assertEquals(res.body.code, "protected_role");
  } finally {
    t.restore();
  }
});

// --- POST /team/role/role -----------------------------------------------------

Deno.test("POST role: creation is a single atomic call", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => CreateRoleEndpoint.handle(),
      { role: "auditor", permissions: ["role:read"] },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(res.status, 201);
    assert(
      t.rest.rows("internal_t__admin_users_roles").some((r) => r.role === "auditor"),
    );
    assertEquals(
      t.rest.rows("internal_t__admin_users_role_permissions").filter((r) => r.role === "auditor").length,
      1,
    );
  } finally {
    t.restore();
  }
});

Deno.test(
  "POST role: a permission the caller does not hold is refused",
  async () => {
    const t = setup();

    try {
      const res = await callEndpoint(
        () => CreateRoleEndpoint.handle(),
        { role: "auditor", permissions: ["intra:supabase"] },
        signedIn("support", WEAK_PERMISSIONS),
      );

      assertEquals(res.status, 403);
      assertEquals(res.body.code, "not_permitted");
      assert(
        !t.rest.rows("internal_t__admin_users_roles").some((r) => r.role === "auditor"),
        "nothing must be written when authority is refused",
      );
    } finally {
      t.restore();
    }
  },
);

Deno.test("POST role: an unknown permission is a 400", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => CreateRoleEndpoint.handle(),
      { role: "auditor", permissions: ["role:read", "does:not:exist"] },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_permissions");
  } finally {
    t.restore();
  }
});

// --- PUT /team/role/role/permissions ------------------------------------------

Deno.test("PUT permissions: the replacement is a single atomic call", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => UpdateRoleEndpoint.handle(),
      { role: "temp", permissions: ["role:read"] },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(res.status, 200);
    assertEquals(
      t.rest.rows("internal_t__admin_users_role_permissions")
        .filter((r) => r.role === "temp")
        .map((r) => r.permission),
      ["role:read"],
    );
  } finally {
    t.restore();
  }
});

Deno.test("PUT permissions: input is normalised like every other verb", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => UpdateRoleEndpoint.handle(),
      { role: "  TEMP ", permissions: [" ROLE:READ ", "role:read"] },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(
      res.status,
      200,
      "before normalisation this returned 404 on the role and 400 on the permissions",
    );
    assertEquals(
      t.rest.rows("internal_t__admin_users_role_permissions")
        .filter((r) => r.role === "temp")
        .map((r) => r.permission),
      ["role:read"],
    );
  } finally {
    t.restore();
  }
});

Deno.test("PUT permissions: the owner role stays locked", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => UpdateRoleEndpoint.handle(),
      { role: "owner", permissions: ["role:read"] },
      signedIn("owner", ALL_PERMISSIONS),
    );

    assertEquals(res.status, 403);
    assertEquals(res.body.code, "protected_role");
    assertEquals(
      t.rest.rows("internal_t__admin_users_role_permissions").filter((r) => r.role === "owner").length,
      ALL_PERMISSIONS.length,
    );
  } finally {
    t.restore();
  }
});

Deno.test("PUT permissions: the caller cannot rewrite its own role", async () => {
  const t = setup();

  try {
    const res = await callEndpoint(
      () => UpdateRoleEndpoint.handle(),
      { role: "support", permissions: ["intra:supabase"] },
      signedIn("support", WEAK_PERMISSIONS),
    );

    assertEquals(res.status, 403);
    assertEquals(res.body.code, "own_role");
  } finally {
    t.restore();
  }
});
