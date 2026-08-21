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
import { JwtIdentityResolver } from "@scribe/core/kernel/identity/resolver/jwt_resolver.ts";
import { JwtVerifier } from "@scribe/core/kernel/identity/resolver/jwt_verifier.ts";
import { IdentityRevocation } from "@scribe/core/runtime/redis/identity_revocation.ts";
import { kv, type Kv } from "@scribe/foundation/lib/src/redis/mod.ts";
import { installValkeryMock } from "@scribe/foundation/tests/testing/valkery.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { assert, assertEquals } from "@std/assert";

const USER_JWT = "header.user.signature";
const ADMIN_JWT = "header.admin.signature";

function inSeconds(offset: number): number {
  return Math.floor(Date.now() / 1_000) + offset;
}

interface Claims {
  readonly sub: string;
  readonly email?: string;
  readonly app_metadata?: Record<string, unknown>;
  readonly exp?: number;
  readonly [claim: string]: unknown;
}

/**
 * Stands the resolver up against a fake Redis, a fake verifier and a fake
 * GoTrue, and reports how often each was actually reached.
 */
function harness(claims: Record<string, Claims | null>) {
  const redis = installValkeryMock();
  // A fresh fake Redis is a fresh cache only if the process drops what it was
  // holding too: the local tier outlives the mock otherwise, and every test
  // after the first reads the previous one's identities.
  JwtIdentityResolver.forget();
  const calls = { verify: 0, gotrue: 0 };

  const verifier = installMock(JwtVerifier, "verify", (jwt: string) => {
    calls.verify++;
    return Promise.resolve(claims[jwt] ?? null);
  });

  const realFetch = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request) => {
    calls.gotrue++;
    assert(String(input).endsWith("/user"), "only GoTrue's /user is ever called");
    return Promise.resolve(
      new Response(
        JSON.stringify({
          id: "u1",
          email: "fresh@x.io",
          app_metadata: { role: "user" },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  }) as typeof fetch;

  return {
    calls,
    restore(): void {
      globalThis.fetch = realFetch;
      verifier.restore();
      redis.restore();
    },
  };
}

Deno.test("a second request on the same token never pays for the signature again", async () => {
  const h = harness({
    [USER_JWT]: { sub: "u1", email: "u@x.io", exp: inSeconds(600) },
  });

  try {
    await JwtIdentityResolver.resolveIdentity(USER_JWT);
    await JwtIdentityResolver.resolveIdentity(USER_JWT);

    assertEquals(
      h.calls.verify,
      1,
      "the cache sits in front of the verification: an ES256 signature costs three quarters of the request",
    );
  } finally {
    h.restore();
  }
});

Deno.test("a second request on the same token does not go back to Redis either", async () => {
  const h = harness({
    [USER_JWT]: { sub: "u1", email: "u@x.io", exp: inSeconds(600) },
  });

  const inner = kv().get.bind(kv());
  let reads = 0;
  const counted = installMock(
    kv(),
    "get",
    ((key: string) => {
      reads++;
      return inner(key);
    }) as unknown as Kv["get"],
  );

  try {
    await JwtIdentityResolver.resolveIdentity(USER_JWT);
    const before = reads;

    const again = await JwtIdentityResolver.resolveIdentity(USER_JWT);

    assertEquals(again?.id, "u1");
    assertEquals(
      reads,
      before,
      "the identity cache is read on every authenticated request: holding it in the process is what stops that doubling the Redis load",
    );
  } finally {
    counted.restore();
    h.restore();
  }
});

Deno.test("the process stops answering for a token once its own window has passed", async () => {
  const h = harness({
    [USER_JWT]: { sub: "u1", email: "u@x.io", exp: inSeconds(600) },
  });

  try {
    await JwtIdentityResolver.resolveIdentity(USER_JWT);

    // Six seconds on, past the five the local tier holds for. Redis still has
    // the entry, so this must be a Redis read and not a verification.
    const past = Date.now() + 6_000;
    const later = installMock(Date, "now", (() => past) as unknown as () => number);
    try {
      const again = await JwtIdentityResolver.resolveIdentity(USER_JWT);

      assertEquals(again?.id, "u1");
      assertEquals(
        h.calls.verify,
        1,
        "the shared cache still holds it: only the local window lapsed",
      );
    } finally {
      later.restore();
    }
  } finally {
    h.restore();
  }
});

Deno.test("a cached identity stops being served once its token has expired", async () => {
  const h = harness({
    [USER_JWT]: { sub: "u1", email: "u@x.io", exp: inSeconds(1) },
  });

  try {
    assert(await JwtIdentityResolver.resolveIdentity(USER_JWT));
    assertEquals(h.calls.verify, 1);

    // The same token, two seconds past its own exp. Reading the cache without
    // checking exp would hand the identity back for the rest of the entry's
    // five minutes.
    const past = inSeconds(2) * 1_000;
    const later = installMock(Date, "now", () => past as unknown as number);
    try {
      await JwtIdentityResolver.resolveIdentity(USER_JWT);
      assertEquals(
        h.calls.verify,
        2,
        "an expired entry must send the token back through verification, not answer for it",
      );
    } finally {
      later.restore();
    }
  } finally {
    h.restore();
  }
});

Deno.test("the identity is read from the claims, without asking GoTrue", async () => {
  const h = harness({
    [ADMIN_JWT]: {
      sub: "a1",
      email: "a@x.io",
      app_metadata: { role: "admin" },
      exp: inSeconds(600),
    },
  });

  try {
    const identity = await JwtIdentityResolver.resolveIdentity(ADMIN_JWT);

    assertEquals(identity?.id, "a1");
    assertEquals(identity?.email, "a@x.io");
    assertEquals(identity?.isAdmin, true);
    assertEquals(
      h.calls.gotrue,
      0,
      "GoTrue returns the very values the token already carries, signed",
    );
  } finally {
    h.restore();
  }
});

Deno.test("a revoked user is resolved against GoTrue until the marker lapses", async () => {
  const h = harness({
    [ADMIN_JWT]: {
      sub: "u1",
      email: "stale@x.io",
      app_metadata: { role: "admin" },
      exp: inSeconds(600),
    },
  });

  try {
    await IdentityRevocation.revoke("u1");
    const identity = await JwtIdentityResolver.resolveIdentity(ADMIN_JWT);

    assertEquals(h.calls.gotrue, 1);
    assertEquals(
      identity?.isAdmin,
      false,
      "the claims still say admin: a revocation is exactly the case where they cannot be trusted",
    );
    assertEquals(identity?.email, "fresh@x.io");
  } finally {
    h.restore();
  }
});

Deno.test("a token that fails verification buys nothing, cached or not", async () => {
  const h = harness({ [USER_JWT]: null });

  try {
    assertEquals(await JwtIdentityResolver.resolveIdentity(USER_JWT), null);
    assertEquals(h.calls.gotrue, 0);
  } finally {
    h.restore();
  }
});
