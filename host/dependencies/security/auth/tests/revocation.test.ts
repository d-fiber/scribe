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

import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import { SignOutScope } from "@scribe/core/contracts/account.ts";
import { goTrueError, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assertEquals } from "@std/assert";

Deno.test("logout goes out as POST — a DELETE got a 405 and revoked nothing", async () => {
  const gotrue = installGoTrueMock({
    "POST /logout*": () => ({ status: 204 }),
  });
  try {
    const res = await goTrue.session.logout("token", SignOutScope.Global);

    assertEquals(res.ok, true);
    assertEquals(gotrue.paths(), ["POST /logout?scope=global"]);
  } finally {
    gotrue.restore();
  }
});

Deno.test("logout carries the requested scope", async () => {
  const gotrue = installGoTrueMock({ "POST /logout*": () => ({ status: 204 }) });
  try {
    await goTrue.session.logout("token", SignOutScope.Local);
    assertEquals(gotrue.paths(), ["POST /logout?scope=local"]);
  } finally {
    gotrue.restore();
  }
});

Deno.test("logout presents the bearer token, not the service key", async () => {
  let authorization: string | null = null;
  const original = globalThis.fetch;
  globalThis.fetch = ((_input: string, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("authorization");
    return Promise.resolve(new Response(null, { status: 204 }));
  }) as typeof globalThis.fetch;

  try {
    await goTrue.session.logout("the-bearer-token", SignOutScope.Local);
  } finally {
    globalThis.fetch = original;
  }

  assertEquals(authorization, "Bearer the-bearer-token");
});

Deno.test("AccountRevocation.session does not throw when gotrue refuses", async () => {
  const gotrue = installGoTrueMock({
    "POST /logout*": () => ({ status: 401, body: goTrueError("bad_jwt") }),
  });
  const errors: unknown[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => errors.push(args[0]);

  try {
    await AccountRevocation.session("token");
  } finally {
    console.error = original;
    gotrue.restore();
  }

  assertEquals(gotrue.called("POST", "/logout"), 1);
  assertEquals(errors.length, 1);
});

Deno.test("AccountRevocation.session logs instead of swallowing a network failure", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (() => Promise.reject(new Error("network down"))) as typeof globalThis.fetch;
  const errors: unknown[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => errors.push(args[0]);

  try {
    await AccountRevocation.session("token", SignOutScope.Global);
  } finally {
    console.error = originalError;
    globalThis.fetch = original;
  }

  assertEquals(errors.length, 1);
});
