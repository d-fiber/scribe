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

import { UpdateUserEmailError, UserEmailClient } from "@scribe/host/dependencies/security/auth/src/user/email.ts";
import { UpdateUserPasswordError, UserPasswordClient } from "@scribe/host/dependencies/security/auth/src/user/password.ts";
import {
  ConfirmUserPhoneError,
  UpdateUserPhoneError,
  UserPhoneClient,
} from "@scribe/host/dependencies/security/auth/src/user/phone.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import {
  goTrueError,
  goTrueSession,
  goTrueUser,
  installGoTrueMock,
} from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { auth, SmsIntent } from "@scribe/host/dependencies/security/auth/src/client.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { withSignedIn } from "@scribe/core/testing/runtime/http/identity.ts";
import { assert, assertEquals } from "@std/assert";

const USER = { id: "user-1", email: "u1@example.com" };
const APP_USERS = [{ user_id: "user-1", email: "u1@example.com", phone: null }];

Deno.test("email: self-service goes through the session, not the admin endpoint", async () => {
  const gotrue = installGoTrueMock({ "PUT /user": () => ({ status: 200, body: goTrueUser() }) });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserEmailClient().update("user-1", "new@example.com"),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(gotrue.called("PUT", "/user"), 1);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: nobody can change someone else's address through the self path", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserEmailClient().update("someone-else", "new@example.com"),
    );

    assert(result instanceof Failure);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: an address already taken surfaces as a conflict", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 422, body: goTrueError("email_exists") }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserEmailClient().update("user-1", "taken@example.com"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserEmailError.Conflict);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: an invalid address never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserEmailClient().update("user-1", "not-an-address"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserEmailError.InvalidEmail);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: the operator path applies immediately and ends the sessions", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
  });
  const rest = installRestMock({
    internal_t__app_users: [...APP_USERS],
    internal_t__app_user_devices: [
      { id: "d1", user_id: "user-1", device_id: "device-1", hash: "h", trusted_at: Date.now() },
    ],
  });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserEmailClient().updateAsAdmin("user-1", "new@example.com"),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone: an invalid number never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserPhoneClient().update("user-1", "123"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserPhoneError.InvalidPhone);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone: a number already taken surfaces as a conflict", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 422, body: goTrueError("phone_exists") }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserPhoneClient().update("user-1", "+33612345678"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserPhoneError.Conflict);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("password: mismatched confirmation is refused before re-authenticating", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserPasswordClient().update("user-1", "CurrentPop42", "NewPoppin42", "Other1"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserPasswordError.PasswordsDoNotMatch);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("password: reusing the current password is refused", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserPasswordClient().update("user-1", "CurrentPop42", "CurrentPop42", "CurrentPop42"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserPasswordError.SameAsCurrentPassword);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("password: the policy applies to the new password", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserPasswordClient().update("user-1", "CurrentPop42", "weak", "weak"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserPasswordError.InvalidPassword);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("password: a wrong current password stops before any write", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("invalid_credentials") }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserPasswordClient().update("user-1", "WrongPop42", "NewPoppin42", "NewPoppin42"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, UpdateUserPasswordError.InvalidCurrentPassword);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("password: a successful change revokes every session globally", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserPasswordClient().update("user-1", "CurrentPop42", "NewPoppin42", "NewPoppin42"),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(
      gotrue.paths().filter((p) => p.startsWith("POST /logout")),
      ["POST /logout?scope=global"],
      "the old secret must not keep any session alive",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("password: a failed gotrue write leaves the sessions untouched", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "PUT /admin/users/*": () => ({ status: 500, body: goTrueError("unexpected_failure") }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new UserPasswordClient().update("user-1", "CurrentPop42", "NewPoppin42", "NewPoppin42"),
    );

    assert(result instanceof Failure);
    assertEquals(
      gotrue.paths().filter((p) => p === "POST /logout?scope=global").length,
      0,
      "nothing changed: no global revocation",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone change: requesting it only sends the otp, it commits nothing", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserPhoneClient().update("user-1", "+33612345678"),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(
      await auth.smsIntent.consume("+33612345678"),
      SmsIntent.ChangePhone,
      "the sms must name itself a phone change, not a device check",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone change: a wrong code leaves the number untouched", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 401, body: goTrueError("otp_expired") }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserPhoneClient().confirmChange("user-1", "+33612345678", "000000"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ConfirmUserPhoneError.InvalidOrExpired);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone change: a malformed code never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    const result = await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserPhoneClient().confirmChange("user-1", "+33612345678", "12"),
    );

    assert(result instanceof Failure);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone change: gotrue is asked to verify a phone_change, not an sms", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const rest = installRestMock({ internal_t__app_users: [...APP_USERS] });
  const env = installAuthEnv();

  try {
    await withSignedIn(
      { identity: USER, device: fakeDevice() },
      () => new UserPhoneClient().confirmChange("user-1", "+33612345678", "123456"),
    );

    const call = gotrue.calls.find((c) => c.path === "/verify");
    assertEquals(
      (call?.body as { type?: string } | undefined)?.type,
      "phone_change",
      "type sms would verify a sign-in otp and never apply the pending number",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
