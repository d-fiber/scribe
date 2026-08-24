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

import "@scribe/core/testing/settings.ts";
import type { Grants } from "@scribe/core/contracts/grants.ts";
import { RbacIdentity, RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import type { ResolvedJwtIdentity } from "@scribe/core/kernel/identity/resolver/jwt_resolver.ts";
import { JwtIdentityResolver } from "@scribe/core/kernel/identity/resolver/jwt_resolver.ts";
import { GrantsResolver } from "@scribe/core/runtime/support/ports/grants.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { assertEquals } from "@std/assert";

const GRANTED: Grants = {
  role: "shift-lead",
  permissions: ["brand.read"],
};

const JWT = "aaa.bbb.ccc";

function withBearer<T>(token: string | null, run: () => Promise<T>): Promise<T> {
  const headers: Record<string, string> = token === null ? {} : { Authorization: `Bearer ${token}` };
  const req = new Request("http://api.test/", { headers: new Headers(headers) });

  return RequestScope.run(req, new Uint8Array(0), run, "127.0.0.1");
}

function resolvingTo(identity: ResolvedJwtIdentity | null, granted: Grants | null = GRANTED) {
  const mocks = [
    installMock(JwtIdentityResolver, "resolveIdentity", () => Promise.resolve(identity)),
    installMock(GrantsResolver, "resolve", () => Promise.resolve(granted)),
  ];

  return { restore: () => mocks.forEach((mock) => mock.restore()) };
}

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
  const resolver = resolvingTo({ id: "u1", claims: {} });
  try {
    assertEquals(await withBearer(null, () => RequestIdentity.isConnected()), false);
  } finally {
    resolver.restore();
  }
});

Deno.test("a caller the deployment grants nothing is still a caller", async () => {
  const resolver = resolvingTo({ id: "u1", claims: {} }, null);
  try {
    assertEquals(await withBearer(JWT, () => RequestIdentity.isConnected()), true);
    assertEquals(await withBearer(JWT, () => RequestIdentity.userId()), "u1");
    assertEquals(await withBearer(JWT, () => RequestIdentity.role()), null);
    assertEquals(await withBearer(JWT, () => RbacIdentity.permissions()), []);
  } finally {
    resolver.restore();
  }
});

Deno.test("the role a caller carries is the word the deployment granted, whatever it is", async () => {
  const resolver = resolvingTo({ id: "a1", claims: {} });
  try {
    assertEquals(await withBearer(JWT, () => RequestIdentity.role()), "shift-lead");
    assertEquals(await withBearer(JWT, () => RbacIdentity.permissions()), ["brand.read"]);
    assertEquals(await withBearer(JWT, () => RbacIdentity.grants(["brand.read"])), true);
    assertEquals(await withBearer(JWT, () => RbacIdentity.grants(["brand.write"])), false);
  } finally {
    resolver.restore();
  }
});

Deno.test("a caller with no address is a caller like any other", async () => {
  const resolver = resolvingTo({ id: "u1", claims: {} });
  try {
    assertEquals(await withBearer(JWT, () => RequestIdentity.isConnected()), true);
  } finally {
    resolver.restore();
  }
});

Deno.test("everything the token asserted travels, and nothing here reads it", async () => {
  const resolver = resolvingTo({
    id: "u1",
    claims: { email: "u@x.io", tenant: "acme", app_metadata: { role: "admin" } },
  });
  try {
    const claims = await withBearer(JWT, async () => {
      await RequestIdentity.isConnected();
      return RequestIdentity.current?.claims;
    });

    assertEquals(claims?.email, "u@x.io");
    assertEquals(claims?.tenant, "acme");
    assertEquals(
      await withBearer(JWT, () => RequestIdentity.role()),
      "shift-lead",
      "a role asserted in the token is a claim, and only what the deployment granted is the role",
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
      return Promise.resolve({ id: "u1", claims: {} });
    }),
    installMock(GrantsResolver, "resolve", () => Promise.resolve(GRANTED)),
  ];

  try {
    await withBearer(JWT, async () => {
      await RequestIdentity.isConnected();
      await RequestIdentity.userId();
      await RequestIdentity.role();
      await RbacIdentity.permissions();
    });

    assertEquals(calls, 1);
  } finally {
    mocks.forEach((mock) => mock.restore());
  }
});
