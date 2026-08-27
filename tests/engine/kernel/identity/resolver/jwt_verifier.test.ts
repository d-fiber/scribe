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

import "@scribe/testing/settings.ts";
import { JwtVerifier } from "@scribe/kernel/identity/resolver/jwt_verifier.ts";
import { identitySettings } from "@scribe/runtime/support/settings/identity.ts";
import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { SignJWT } from "jose";

const SECRET = () => new TextEncoder().encode(Deno.env.get("JWT_SECRET")!);

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

/** An ES256 token, well enough formed for the verifier to pick its branch and then refuse it. */
const ASYMMETRIC = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1MSJ9.c2ln";

/** Runs `run` with `authUrl` in the identity slot, putting back what was there. */
async function withAuthUrl(authUrl: string | undefined, run: () => Promise<void>): Promise<void> {
  const held = identitySettings.get();
  identitySettings.use({ ...held, authUrl });
  try {
    await run();
  } finally {
    identitySettings.use(held);
  }
}

/** What `run` wrote on the error channel. */
async function errorsOf(run: () => Promise<void>): Promise<string[]> {
  const written: string[] = [];
  const held = console.error;
  console.error = (...args: unknown[]) => written.push(String(args[0]));
  try {
    await run();
  } finally {
    console.error = held;
  }
  return written;
}

Deno.test("verify: a deployment with no identity service refuses in silence", async () => {
  await withAuthUrl(undefined, async () => {
    const written = await errorsOf(async () => {
      for (let call = 0; call < 5; call++) assertEquals(await JwtVerifier.verify(ASYMMETRIC), null);
    });

    assertEquals(
      written,
      [],
      "mounting no identity package is the ordinary state of such a deployment, and a line per token it is shown is a log an attacker fills",
    );
  });
});

Deno.test("verify: an address that is set and unusable is named once, not once per token", async () => {
  await withAuthUrl("not a url at all", async () => {
    const written = await errorsOf(async () => {
      for (let call = 0; call < 5; call++) assertEquals(await JwtVerifier.verify(ASYMMETRIC), null);
    });

    assertEquals(written.length, 1, "the fault is worth saying, and worth saying once");
    assert(written[0].includes("not a url at all"), "a line that does not name the address it failed on helps nobody");
  });
});

Deno.test("verify: the key set follows the address, instead of freezing on the first one read", async () => {
  await withAuthUrl("https://first.example", async () => {
    await JwtVerifier.verify(ASYMMETRIC);
  });

  await withAuthUrl("still not a url", async () => {
    const written = await errorsOf(async () => {
      assertEquals(await JwtVerifier.verify(ASYMMETRIC), null);
    });

    assert(
      written.some((line) => line.includes("still not a url")),
      "a set frozen on the first address ever read ignores a slot filled again, without a word",
    );
  });
});
