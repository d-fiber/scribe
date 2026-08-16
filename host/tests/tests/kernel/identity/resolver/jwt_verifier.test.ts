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
import { Env } from "@scribe/host/env.ts";
import { JwtVerifier } from "@scribe/core/kernel/identity/resolver/jwt_verifier.ts";
import { assertEquals, assertNotEquals } from "@std/assert";
import { SignJWT } from "jose/jwt/sign.ts";

const SECRET = () => new TextEncoder().encode(Env.JWT_SECRET!);

interface Claims {
  sub?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

function hs256(claims: Claims, alg = "HS256"): Promise<string> {
  const { aud, exp, ...rest } = claims;
  let jwt = new SignJWT({ ...rest }).setProtectedHeader({ alg });
  if (aud !== undefined) jwt = jwt.setAudience(aud);
  jwt = jwt.setExpirationTime(exp ?? Math.floor(Date.now() / 1000) + 3600);
  return jwt.sign(SECRET());
}

function endUser(overrides: Claims = {}): Promise<string> {
  return hs256({
    sub: "user-1",
    role: "authenticated",
    aud: "authenticated",
    ...overrides,
  });
}

Deno.test("verify: a well-formed end-user token is accepted", async () => {
  const payload = await JwtVerifier.verify(await endUser());

  assertNotEquals(payload, null);
  assertEquals(payload?.sub, "user-1");
});

Deno.test("verify: a service-role token signed with the same secret is refused", async () => {
  const serviceRole = await hs256({
    role: "service_role",
    aud: "authenticated",
    sub: "service",
  });

  assertEquals(
    await JwtVerifier.verify(serviceRole),
    null,
    "JWT_SECRET also signs the service keys: only role=authenticated may stand for a person",
  );
});

Deno.test("verify: an anon token is refused", async () => {
  const anon = await hs256({ role: "anon", aud: "authenticated", sub: "anon" });

  assertEquals(await JwtVerifier.verify(anon), null);
});

Deno.test("verify: a token without a role claim is refused", async () => {
  assertEquals(await JwtVerifier.verify(await hs256({ sub: "user-1", aud: "authenticated" })), null);
});

Deno.test("verify: a token without a subject is refused", async () => {
  assertEquals(await JwtVerifier.verify(await endUser({ sub: undefined })), null);
});

Deno.test("verify: an empty subject is refused", async () => {
  assertEquals(await JwtVerifier.verify(await endUser({ sub: "" })), null);
});

Deno.test("verify: the wrong audience is refused", async () => {
  assertEquals(await JwtVerifier.verify(await endUser({ aud: "anon" })), null);
  assertEquals(await JwtVerifier.verify(await endUser({ aud: undefined })), null);
});

Deno.test("verify: an expired token is refused", async () => {
  const expired = await endUser({ exp: Math.floor(Date.now() / 1000) - 60 });

  assertEquals(await JwtVerifier.verify(expired), null);
});

Deno.test("verify: a token signed with another secret is refused", async () => {
  const foreign = await new SignJWT({ role: "authenticated", sub: "user-1" })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("authenticated")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("not-the-real-secret"));

  assertEquals(await JwtVerifier.verify(foreign), null);
});

Deno.test("verify: alg none is refused", async () => {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
    .replace(/=+$/, "");
  const body = btoa(
    JSON.stringify({
      sub: "user-1",
      role: "authenticated",
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).replace(/=+$/, "");

  assertEquals(await JwtVerifier.verify(`${header}.${body}.`), null);
});

Deno.test("verify: an unlisted algorithm is refused", async () => {
  const hs512 = await hs256(
    { sub: "user-1", role: "authenticated", aud: "authenticated" },
    "HS512",
  );

  assertEquals(
    await JwtVerifier.verify(hs512),
    null,
    "the allow-list is closed: a new alg has to be opted into explicitly",
  );
});

Deno.test("verify: garbage never throws, it returns null", async () => {
  for (const bad of ["", "   ", "a.b", "a.b.c", "....", "x".repeat(5000)]) {
    assertEquals(await JwtVerifier.verify(bad), null, `"${bad.slice(0, 8)}"`);
  }
});
