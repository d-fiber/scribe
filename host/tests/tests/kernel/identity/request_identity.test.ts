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

import "@scribe/core/testing/settings.ts";
import type { AdminRbac } from "@scribe/core/contracts/rbac.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { JwtIdentityResolver } from "@scribe/core/kernel/identity/resolver/jwt_resolver.ts";
import { AdminRbacResolver } from "@scribe/core/kernel/identity/resolver/rbac_resolver.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { assertEquals } from "@std/assert";

interface ResolvedIdentity {
  readonly id: string;
  readonly email: string | null;
  readonly isAdmin: boolean;
}

const RBAC: AdminRbac = {
  role: "superadmin",
  permissions: ["brand.read"],
};

function withBearer<T>(token: string | null, run: () => Promise<T>): Promise<T> {
  const headers: Record<string, string> = token === null
    ? {}
    : { Authorization: `Bearer ${token}` };
  const req = new Request("http://api.test/", { headers: new Headers(headers) });

  return RequestScope.run(req, new Uint8Array(0), run, "127.0.0.1");
}

function resolvingTo(identity: ResolvedIdentity | null) {
  const mocks = [
    installMock(
      JwtIdentityResolver,
      "resolveIdentity",
      () => Promise.resolve(identity),
    ),
    installMock(AdminRbacResolver, "resolve", () => Promise.resolve(RBAC)),
  ];

  return { restore: () => mocks.forEach((mock) => mock.restore()) };
}

const JWT = "aaa.bbb.ccc";

Deno.test("a bearer that is not three non-empty segments never reaches the resolver", async () => {
  let calls = 0;
  const mock = installMock(JwtIdentityResolver, "resolveIdentity", () => {
    calls++;
    return Promise.resolve(null);
  });

  try {
    for (const token of ["", "a.b", "a.b.c.d", "a..c", ".b.c"]) {
      assertEquals(
        await withBearer(token, () => RequestIdentity.isConnected()),
        false,
        `"${token}" is not a well-formed JWT`,
      );
    }
    assertEquals(calls, 0, "a malformed bearer must not cost a GoTrue lookup");
  } finally {
    mock.restore();
  }
});

Deno.test("no bearer at all resolves to nobody", async () => {
  const resolver = resolvingTo({ id: "u1", email: "u@x.io", isAdmin: false });
  try {
    assertEquals(await withBearer(null, () => RequestIdentity.isConnected()), false);
  } finally {
    resolver.restore();
  }
});

Deno.test("a resolved end user is a user and never an admin", async () => {
  const resolver = resolvingTo({ id: "u1", email: "u@x.io", isAdmin: false });
  try {
    assertEquals(await withBearer(JWT, () => RequestIdentity.isUser()), true);
    assertEquals(await withBearer(JWT, () => RequestIdentity.isAdmin()), false);
    assertEquals(
      await withBearer(JWT, () => RequestIdentity.role()),
      AccountRole.User,
    );
  } finally {
    resolver.restore();
  }
});

Deno.test("a resolved admin carries its rbac rules", async () => {
  const resolver = resolvingTo({ id: "a1", email: "a@x.io", isAdmin: true });
  try {
    assertEquals(await withBearer(JWT, () => RequestIdentity.isAdmin()), true);
    assertEquals(await withBearer(JWT, () => RequestIdentity.isUser()), false);
    assertEquals(await withBearer(JWT, () => RequestIdentity.userId()), "a1");
  } finally {
    resolver.restore();
  }
});

Deno.test("an admin without an email is refused, not handed out half-built", async () => {
  const resolver = resolvingTo({ id: "a1", email: null, isAdmin: true });
  try {
    assertEquals(
      await withBearer(JWT, () => RequestIdentity.isAdmin()),
      false,
      "SessionAdmin.email is required: filling it with undefined only moves the failure further away",
    );
    assertEquals(await withBearer(JWT, () => RequestIdentity.isConnected()), false);
  } finally {
    resolver.restore();
  }
});

Deno.test("an end user without an email stays a valid user", async () => {
  const resolver = resolvingTo({ id: "u1", email: null, isAdmin: false });
  try {
    assertEquals(
      await withBearer(JWT, () => RequestIdentity.isUser()),
      true,
      "SessionUser.email is nullable, unlike the admin one",
    );
  } finally {
    resolver.restore();
  }
});

Deno.test("the identity is resolved once per request, however many times it is read", async () => {
  let calls = 0;
  const mocks = [
    installMock(JwtIdentityResolver, "resolveIdentity", () => {
      calls++;
      return Promise.resolve({ id: "u1", email: "u@x.io", isAdmin: false });
    }),
    installMock(AdminRbacResolver, "resolve", () => Promise.resolve(RBAC)),
  ];

  try {
    await withBearer(JWT, async () => {
      await RequestIdentity.isConnected();
      await RequestIdentity.isUser();
      await RequestIdentity.userId();
      await RequestIdentity.role();
    });

    assertEquals(calls, 1);
  } finally {
    mocks.forEach((mock) => mock.restore());
  }
});
