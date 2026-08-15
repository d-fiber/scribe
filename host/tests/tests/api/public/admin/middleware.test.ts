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

import { isVpnConnected, permission, requireAdminAppKey, requireVpn } from "@scribe/host/api/public/admin/middleware.ts";
import { Env } from "@scribe/host/env.ts";
import { RequestIdentityCache } from "@scribe/core/runtime/http/accessors/identity.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { assertEquals, assertFalse } from "@std/assert";
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";

const ADMIN_KEY = Env.ADMIN_APP_KEYS[0];
const VPN_IP = "10.8.0.42";
const OFF_VPN_IP = "203.0.113.9";
const TRUSTED_PEER = "172.18.0.4";

function guardedApp(...guards: MiddlewareHandler[]): Hono {
  const app = new Hono();
  app.use("*", ...guards);
  app.get("/", (c) => c.json({ reached: true }));
  return app;
}

interface CallOptions {
  readonly headers?: Record<string, string>;
  readonly peer?: string | null;
  readonly identity?: { id: string; email: string; rules?: { role: string; permissions: string[] } };
}

async function call(
  app: Hono,
  { headers = {}, peer = TRUSTED_PEER, identity }: CallOptions = {},
): Promise<number> {
  const request = new Request("http://admin.test/", { headers });

  return await RequestScope.run(request, new Uint8Array(0), async () => {
    if (identity) {
      await RequestIdentityCache.remember(() => Promise.resolve(identity));
    }
    const response = await app.fetch(request);
    return response.status;
  }, peer);
}

function vpnHeaders(ip: string): Record<string, string> {
  return { "x-real-ip": ip };
}

// --- requireVpn ---------------------------------------------------------------

Deno.test("requireVpn: an address inside the wireguard subnet passes", async () => {
  const env = withSubnet("10.8.0.");
  try {
    assertEquals(
      await call(guardedApp(requireVpn), { headers: vpnHeaders(VPN_IP) }),
      200,
    );
  } finally {
    env();
  }
});

Deno.test("requireVpn: an address outside the subnet is a 403", async () => {
  const env = withSubnet("10.8.0.");
  try {
    assertEquals(
      await call(guardedApp(requireVpn), { headers: vpnHeaders(OFF_VPN_IP) }),
      403,
    );
  } finally {
    env();
  }
});

Deno.test("requireVpn: a spoofed x-real-ip from an untrusted peer is a 403", async () => {
  const env = withSubnet("10.8.0.");
  try {
    assertEquals(
      await call(guardedApp(requireVpn), {
        headers: vpnHeaders(VPN_IP),
        peer: "203.0.113.9",
      }),
      403,
      "reaching the API directly must not let a client claim a VPN address",
    );
  } finally {
    env();
  }
});

Deno.test("requireVpn: forwarding headers cannot stand in for x-real-ip", async () => {
  const env = withSubnet("10.8.0.");
  try {
    assertEquals(
      await call(guardedApp(requireVpn), {
        headers: { "x-forwarded-for": VPN_IP, "cf-connecting-ip": VPN_IP },
      }),
      403,
    );
  } finally {
    env();
  }
});

Deno.test("requireVpn: a neighbouring subnet does not pass", async () => {
  const env = withSubnet("10.8.0.");
  try {
    assertEquals(
      await call(guardedApp(requireVpn), { headers: vpnHeaders("10.80.0.5") }),
      403,
    );
  } finally {
    env();
  }
});

Deno.test("isVpnConnected: a malformed subnet prefix fails closed", async () => {
  const env = withSubnet("10.8.0");
  try {
    const connected = await RequestScope.run(
      new Request("http://admin.test/", { headers: vpnHeaders(VPN_IP) }),
      new Uint8Array(0),
      () => isVpnConnected(),
      TRUSTED_PEER,
    );
    assertFalse(
      connected,
      "a prefix without its trailing dot must lock the admin API, not open it",
    );
  } finally {
    env();
  }
});

// --- requireAdminAppKey -------------------------------------------------------

Deno.test("requireAdminAppKey: the valid key passes, anything else is a 401", async () => {
  const app = guardedApp(requireAdminAppKey);

  assertEquals(
    await call(app, { headers: { "x-admin-app-key": ADMIN_KEY } }),
    200,
  );
  assertEquals(await call(app, {}), 401);
  assertEquals(await call(app, { headers: { "x-admin-app-key": "nope" } }), 401);
  assertEquals(
    await call(app, { headers: { "x-app-key": Env.APP_KEYS[0] } }),
    401,
  );
});

// --- permission ---------------------------------------------------------------

function admin(permissions: string[]) {
  return {
    id: "admin-1",
    email: "a1@example.com",
    rules: { role: "manager", permissions },
  };
}

Deno.test("permission: the exact permission passes", async () => {
  assertEquals(
    await call(guardedApp(permission("team:read")), {
      identity: admin(["team:read", "team:update"]),
    }),
    200,
  );
});

Deno.test("permission: a missing permission is a 403", async () => {
  assertEquals(
    await call(guardedApp(permission("team:delete")), {
      identity: admin(["team:read", "team:update"]),
    }),
    403,
  );
});

Deno.test("permission: an anonymous caller never satisfies a permission", async () => {
  assertEquals(await call(guardedApp(permission("team:read")), {}), 403);
});

Deno.test("permission: a non-admin identity holds no permission at all", async () => {
  assertEquals(
    await call(guardedApp(permission("team:read")), {
      identity: { id: "user-1", email: "u1@example.com" },
    }),
    403,
    "a plain user has no rules bag: RbacIdentity.permissions() must read empty, not throw",
  );
});

Deno.test("permission: a prefix of a held permission is not the permission", async () => {
  assertEquals(
    await call(guardedApp(permission("team")), {
      identity: admin(["team:read"]),
    }),
    403,
  );
  assertEquals(
    await call(guardedApp(permission("team:read:all")), {
      identity: admin(["team:read"]),
    }),
    403,
  );
});

function withSubnet(prefix: string): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(Env, "WG_SUBNET_PREFIX");
  Object.defineProperty(Env, "WG_SUBNET_PREFIX", {
    get: () => prefix,
    configurable: true,
  });
  return () => {
    if (descriptor) Object.defineProperty(Env, "WG_SUBNET_PREFIX", descriptor);
  };
}
