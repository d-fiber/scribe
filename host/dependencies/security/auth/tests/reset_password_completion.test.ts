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
import { PendingToken, PendingTokenPurpose } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import {
  ResetPasswordCompleteError,
  ResetPasswordCompletion,
} from "@scribe/host/dependencies/security/auth/src/reset_password/completion.ts";
import { ResetPasswordClient } from "@scribe/host/dependencies/security/auth/src/reset_password/reset_password.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";
import { forgeToken, issueToken } from "@scribe/host/dependencies/security/auth/testing/pending_token.ts";

const EMAIL = "u1@example.com";
const PHONE = "+33612345678";
const STRONG = "NewPassw0rd";

const resetToken = new PendingToken(PendingTokenPurpose.PasswordReset);

function appUsers() {
  return [{ user_id: "user-1", email: EMAIL, phone: PHONE }];
}

async function issuedToken(
  identifier = EMAIL,
  role = AccountRole.User,
): Promise<{ token: string; hash: string }> {
  const token = await forgeToken(identifier, role, { purpose: PendingTokenPurpose.PasswordReset });
  return { token, hash: await sha256Hex(token) };
}

function pendingRow(hash: string) {
  return { token_hash: hash, expires_at: Date.now() + 600_000 };
}

Deno.test("complete: a valid token sets the password and burns the token", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const { token, hash } = await issuedToken();
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, STRONG),
    );

    assert(result instanceof OK, `expected success, got ${JSON.stringify(result)}`);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);
    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      0,
      "the token is single-use: it must be gone once spent",
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: the same token cannot be replayed", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const { token, hash } = await issuedToken();
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const completion = new ResetPasswordCompletion(AccountRole.User);
    const first = await withRequest(
      fakeDevice(),
      () => completion.complete(token, STRONG, STRONG),
    );
    const second = await withRequest(
      fakeDevice(),
      () => completion.complete(token, "OtherPassw0rd", "OtherPassw0rd"),
    );

    assert(first instanceof OK);
    assert(second instanceof Failure);
    assertEquals(second.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a token signed for sign-in is refused", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [],
  });
  const env = installAuthEnv();

  const signInToken = await issueToken(
    new PendingToken(PendingTokenPurpose.SignIn),
    EMAIL,
    AccountRole.User,
  );

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(signInToken, STRONG, STRONG),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a token absent from the store is refused", async () => {
  const gotrue = installGoTrueMock({});
  const { token } = await issuedToken();
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, STRONG),
    );

    assert(
      result instanceof Failure,
      "a correctly signed token that was already consumed must not work",
    );
    assertEquals(result.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: garbage tokens are refused without throwing", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const completion = new ResetPasswordCompletion(AccountRole.User);
    for (const bad of ["", "   ", "not-a-token", "aGVsbG8=.zzzz", "x".repeat(3000)]) {
      const result = await withRequest(
        fakeDevice(),
        () => completion.complete(bad, STRONG, STRONG),
      );
      assert(result instanceof Failure, `"${bad.slice(0, 12)}" must be refused`);
      assertEquals(result.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    }
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: mismatched passwords leave the token usable", async () => {
  const gotrue = installGoTrueMock({});
  const { token, hash } = await issuedToken();
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, "Different0ne"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ResetPasswordCompleteError.PasswordsDoNotMatch);
    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      1,
      "a typo must not burn the reset token",
    );
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a weak password is refused and nothing is written", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const { token, hash } = await issuedToken();
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, "short", "short"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ResetPasswordCompleteError.InvalidPassword);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a token whose account vanished is refused", async () => {
  const gotrue = installGoTrueMock({});
  const { token, hash } = await issuedToken("ghost@example.com");
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, STRONG),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a phone-issued token resolves the same account", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const { token, hash } = await issuedToken(PHONE);
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, STRONG),
    );

    assert(result instanceof OK, "the sms branch must reach the same completion");
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a user token cannot reach an admin account", async () => {
  const gotrue = installGoTrueMock({});
  const { token, hash } = await issuedToken("a1@example.com", AccountRole.User);
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__admin_users: [{ admin_id: "admin-1", email: "a1@example.com", phone: null }],
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, STRONG),
    );

    assert(
      result instanceof Failure,
      "the role is bound to the token: a user token must not resolve an admin row",
    );
    assertEquals(gotrue.called("PUT", "/admin/users/admin-1"), 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("issue: the recovery session is revoked and swapped for a reset token", async () => {
  const gotrue = installGoTrueMock({ "POST /logout*": () => ({ status: 204 }) });
  const database = installDatabaseMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const token = await withRequest(
      fakeDevice(),
      () =>
        new ResetPasswordCompletion(AccountRole.User).issue(
          "user-1",
          "recovery-access-token",
        ),
    );

    assert(token, "a known account must get a reset token");
    assertEquals(
      gotrue.called("POST", "/logout"),
      1,
      "the recovery session must die when the reset token is born",
    );

    const payload = await resetToken.payload(token);
    assertEquals(payload?.identifier, EMAIL);
    assertEquals(payload?.role, AccountRole.User);
    assertEquals(database.rows("internal_t__otp_pending_tokens").length, 1);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("issue: an unknown account yields no token", async () => {
  const gotrue = installGoTrueMock({ "POST /logout*": () => ({ status: 204 }) });
  const database = installDatabaseMock({ internal_t__app_users: [] });
  const env = installAuthEnv();

  try {
    const token = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).issue("ghost", "tok"),
    );

    assertEquals(token, null);
    assertEquals(database.rows("internal_t__otp_pending_tokens").length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("issue then complete: the email branch closes end to end", async () => {
  const gotrue = installGoTrueMock({
    "POST /logout*": () => ({ status: 204 }),
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const database = installDatabaseMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const completion = new ResetPasswordCompletion(AccountRole.User);
    const token = await withRequest(
      fakeDevice(),
      () => completion.issue("user-1", "recovery-access-token"),
    );
    assert(token);

    const result = await withRequest(
      fakeDevice(),
      () => completion.complete(token, STRONG, STRONG),
    );

    assert(result instanceof OK, `expected success, got ${JSON.stringify(result)}`);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);
    assertEquals(database.rows("internal_t__otp_pending_tokens").length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: an admin token is refused by the user surface", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "admin-1" } }),
  });
  const { token, hash } = await issuedToken("admin@example.com", AccountRole.Admin);
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__admin_users: [{ admin_id: "admin-1", email: "admin@example.com" }],
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.User).complete(token, STRONG, STRONG),
    );

    assert(result instanceof Failure, "a role mismatch must not set any password");
    assertEquals(result.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    assertEquals(gotrue.calls.length, 0, "gotrue must never be reached");
    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      1,
      "a refused token stays available for its own surface",
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("complete: a user token is refused by the admin surface", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const { token, hash } = await issuedToken();
  const database = installDatabaseMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [pendingRow(hash)],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new ResetPasswordCompletion(AccountRole.Admin).complete(token, STRONG, STRONG),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ResetPasswordCompleteError.InvalidOrExpiredToken);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("completionForToken: the role comes from the token, not from the surface", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const client = new ResetPasswordClient();

  try {
    const userToken = await forgeToken("u1@example.com", AccountRole.User, {
      purpose: PendingTokenPurpose.PasswordReset,
    });
    const adminToken = await forgeToken("a1@example.com", AccountRole.Admin, {
      purpose: PendingTokenPurpose.PasswordReset,
    });

    assertEquals(
      await client.completionForToken(userToken),
      client.user.completion,
    );
    assertEquals(
      await client.completionForToken(adminToken),
      client.admin.completion,
    );
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("completionForToken: an unreadable token routes nowhere", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const client = new ResetPasswordClient();

  try {
    assertEquals(await client.completionForToken(""), null);
    assertEquals(await client.completionForToken("not-a-token"), null);
    assertEquals(
      await client.completionForToken(
        await forgeToken("u1@example.com", AccountRole.User, {
          purpose: PendingTokenPurpose.SignIn,
        }),
      ),
      null,
      "a token minted for another purpose must not open the reset page",
    );
  } finally {
    database.restore();
    env.restore();
  }
});
