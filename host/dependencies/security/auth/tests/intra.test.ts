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

import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { AccountRevocation } from "@scribe/host/dependencies/security/auth/src/_core/revocation.ts";
import { IntraSignIn } from "@scribe/host/dependencies/security/auth/src/sign_in/providers/intra.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import {
  goTrueError,
  goTrueSession,
  goTrueUser,
  installGoTrueMock,
} from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assertEquals } from "@std/assert";

const ADMIN_SESSION = goTrueSession({
  user: goTrueUser({ id: "admin-1", app_metadata: { provider: "email", role: "admin" } }),
});

Deno.test("intra: a valid admin is authenticated and its technical session revoked", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: ADMIN_SESSION }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const adminId = await withRequest(
      fakeDevice(),
      () => new IntraSignIn().withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
    );
    assertEquals(adminId, "admin-1");
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("intra: a non-admin account is refused", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const adminId = await withRequest(
      fakeDevice(),
      () => new IntraSignIn().withEmailAndPassword("u1@example.com", "Poppin2Alpha"),
    );
    assertEquals(adminId, null);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test(
  "intra: a replayed forward_auth does not redo one bcrypt per request",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: ADMIN_SESSION }),
      "POST /logout*": () => ({ status: 204 }),
    });
    const database = installDatabaseMock({});
    const env = installAuthEnv();

    try {
      const intra = new IntraSignIn();
      for (let i = 0; i < 20; i++) {
        const adminId = await withRequest(
          fakeDevice(),
          () => intra.withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
        );
        assertEquals(adminId, "admin-1");
      }

      assertEquals(
        gotrue.called("POST", "/token"),
        1,
        "20 requests must produce a single password verification",
      );
    } finally {
      env.restore();
      database.restore();
      gotrue.restore();
    }
  },
);

Deno.test("intra: a different password does not benefit from the cache", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": (call) =>
      call.body?.password === "Poppin2Alpha"
        ? { status: 200, body: ADMIN_SESSION }
        : { status: 400, body: goTrueError("invalid_credentials") },
    "POST /logout*": () => ({ status: 204 }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const intra = new IntraSignIn();
    const ok = await withRequest(
      fakeDevice(),
      () => intra.withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
    );
    const ko = await withRequest(
      fakeDevice(),
      () => intra.withEmailAndPassword("a1@example.com", "WrongPass1"),
    );

    assertEquals(ok, "admin-1");
    assertEquals(ko, null);
    assertEquals(gotrue.called("POST", "/token"), 2);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("intra: a failure is never cached", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("invalid_credentials") }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const intra = new IntraSignIn();
    for (let i = 0; i < 3; i++) {
      await withRequest(
        fakeDevice(),
        () => intra.withEmailAndPassword("a1@example.com", "WrongPass1"),
      );
    }
    assertEquals(gotrue.called("POST", "/token"), 3);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("intra: empty password refused without touching gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const adminId = await withRequest(
      fakeDevice(),
      () => new IntraSignIn().withEmailAndPassword("a1@example.com", ""),
    );
    assertEquals(adminId, null);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("intra: the cache key is keyed, not a bare digest of the credentials", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: ADMIN_SESSION }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new IntraSignIn().withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
    );

    const bare = await sha256Hex("a1@example.com:Poppin2Alpha");
    assertEquals(
      env.cacheKeys.some((key) => key.includes(bare)),
      false,
      "a bare sha256 of the credentials must never reach the keyspace",
    );
    assertEquals(
      env.cacheKeys.some((key) => key.startsWith("intra:auth:")),
      true,
      "the entry is still cached, under a keyed digest",
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("intra: revoking an admin drops its cached decision immediately", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: ADMIN_SESSION }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const intra = new IntraSignIn();
    await withRequest(
      fakeDevice(),
      () => intra.withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
    );
    await withRequest(
      fakeDevice(),
      () => intra.withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
    );
    assertEquals(gotrue.called("POST", "/token"), 1);

    await AccountRevocation.caches("admin-1");

    await withRequest(
      fakeDevice(),
      () => intra.withEmailAndPassword("a1@example.com", "Poppin2Alpha"),
    );
    assertEquals(
      gotrue.called("POST", "/token"),
      2,
      "after revocation the credentials must be verified again",
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});
