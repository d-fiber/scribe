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
import {
  DeleteAccountError,
  RecoverSessionError,
  RefreshSessionError,
  SessionClient,
  SignOutError,
} from "@scribe/host/dependencies/security/auth/src/session/session.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import {
  goTrueError,
  goTrueSession,
  goTrueUser,
  installGoTrueMock,
} from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { withSignedIn } from "@scribe/core/testing/runtime/http/identity.ts";
import { assert, assertEquals } from "@std/assert";

const USER = { id: "user-1", email: "u1@example.com" };

Deno.test("refresh: a valid refresh token yields a session and its role", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().refresh("refresh-token"));

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(result.data.access_token, "access-token");
    assertEquals(result.data.role, AccountRole.User);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("refresh: a rejected refresh token is Unauthorized, never Unexpected", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("refresh_token_not_found") }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().refresh("stale-token"));

    assert(result instanceof Failure);
    assertEquals(result.error, RefreshSessionError.Unauthorized);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("refresh: a session without a user is refused", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession({ user: undefined }) }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().refresh("refresh-token"));

    assert(result instanceof Failure);
    assertEquals(result.error, RefreshSessionError.Unauthorized);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("refresh: the idempotency window is keyed on the refresh token", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const client = new SessionClient();
    await withRequest(fakeDevice(), () => client.refresh("refresh-token"));
    await withRequest(fakeDevice(), () => client.refresh("refresh-token"));

    assertEquals(
      gotrue.called("POST", "/token"),
      1,
      "a replay inside the window must not rotate the token again",
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("refresh: two distinct refresh tokens never share a cache entry", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const client = new SessionClient();
    await withRequest(fakeDevice(), () => client.refresh("token-a"));
    await withRequest(fakeDevice(), () => client.refresh("token-b"));

    assertEquals(gotrue.called("POST", "/token"), 2);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("recover: a still-valid access token avoids rotating the refresh token", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({ status: 200, body: goTrueUser() }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().recover("access-token", "refresh-token"));

    assert(result instanceof OK);
    assertEquals(gotrue.called("POST", "/token"), 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("recover: an expired access token falls back to the refresh token", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({ status: 401, body: goTrueError("bad_jwt") }),
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().recover("stale-access", "refresh-token"));

    assert(result instanceof OK);
    assertEquals(gotrue.called("POST", "/token"), 1);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("recover: both tokens dead is Unauthorized", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({ status: 401, body: goTrueError("bad_jwt") }),
    "POST /token*": () => ({ status: 400, body: goTrueError("refresh_token_not_found") }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().recover("stale-access", "stale-refresh"));

    assert(result instanceof Failure);
    assertEquals(result.error, RecoverSessionError.Unauthorized);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("recover: an empty token is refused without any network call", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const client = new SessionClient();
    const noAccess = await withRequest(fakeDevice(), () => client.recover("", "r"));
    const noRefresh = await withRequest(fakeDevice(), () => client.recover("a", "   "));

    assert(noAccess instanceof Failure);
    assert(noRefresh instanceof Failure);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("signOut: without a session, Unauthorized and nothing is called", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().signOut());

    assert(result instanceof Failure);
    assertEquals(result.error, SignOutError.Unauthorized);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("signOut: a signed-in user revokes its own session, locally", async () => {
  const gotrue = installGoTrueMock({ "POST /logout*": () => ({ status: 204 }) });
  const database = installDatabaseMock({
    internal_t__app_users: [{ user_id: "user-1", email: "u1@example.com" }],
  });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new SessionClient().signOut(),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(
      gotrue.paths().filter((p) => p.startsWith("POST /logout")),
      ["POST /logout?scope=local"],
      "a sign-out must not revoke the account's other sessions",
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("delete: without a session, Unauthorized", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(fakeDevice(), () => new SessionClient().delete());

    assert(result instanceof Failure);
    assertEquals(result.error, DeleteAccountError.Unauthorized);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("delete: revokes globally then deletes the gotrue account", async () => {
  const gotrue = installGoTrueMock({
    "POST /logout*": () => ({ status: 204 }),
    "DELETE /admin/users/*": () => ({ status: 200, body: {} }),
  });
  const database = installDatabaseMock({
    internal_t__app_users: [{ user_id: "user-1", email: "u1@example.com" }],
  });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new SessionClient().delete(),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(
      gotrue.paths().filter((p) => p.startsWith("POST /logout")),
      ["POST /logout?scope=global"],
    );
    assertEquals(gotrue.called("DELETE", "/admin/users/user-1"), 1);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("delete: the per-account limit is keyed on the user id", async () => {
  const gotrue = installGoTrueMock({
    "POST /logout*": () => ({ status: 204 }),
    "DELETE /admin/users/*": () => ({ status: 200, body: {} }),
  });
  const database = installDatabaseMock({
    internal_t__app_users: [{ user_id: "user-1", email: "u1@example.com" }],
  });
  const env = installAuthEnv();

  try {
    await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new SessionClient().delete(),
    );

    const hashed = await sha256Hex("user-1");
    assertEquals(
      env.rateLimitKeys.includes(`user:delete-account:of:${hashed}`),
      true,
      `key missing: ${env.rateLimitKeys.join(", ")}`,
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});
