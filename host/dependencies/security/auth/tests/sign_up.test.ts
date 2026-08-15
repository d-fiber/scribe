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

import { SocialProvider } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/primitives.ts";
import { UserSignUpAccount } from "@scribe/host/dependencies/security/auth/src/sign_up/account/user.ts";
import { EmailSignUp } from "@scribe/host/dependencies/security/auth/src/sign_up/providers/email.ts";
import { SocialSignUp } from "@scribe/host/dependencies/security/auth/src/sign_up/providers/social.ts";
import {
  EmailSignUpError,
  SocialSignUpError,
  type UserEmailSignUp,
  type UserSocialSignUp,
} from "@scribe/host/dependencies/security/auth/src/sign_up/types.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import {
  goTrueError,
  goTrueSession,
  goTrueUser,
  installGoTrueMock,
} from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assert, assertEquals } from "@std/assert";

const SIGN_UP: UserEmailSignUp = {
  email: "u1@example.com",
  password: "Poppin2Alpha",
  data: {},
};

const SOCIAL: UserSocialSignUp = {
  idToken: "id-token",
  nonce: "nonce",
  data: {},
};

Deno.test(
  "social: an already registered account is never deleted by a second sign-up",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
      "DELETE /admin/users/*": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({
      internal_t__app_users: [{ user_id: "user-1", email: "u1@example.com" }],
    });
    const env = installAuthEnv();

    try {
      const provider = new SocialSignUp(
        SocialProvider.Google,
        new UserSignUpAccount<UserSocialSignUp>(),
      );
      const result = await withRequest(fakeDevice(), () => provider.withIdToken(SOCIAL));

      assert(result instanceof Failure);
      assertEquals(result.error, SocialSignUpError.AccountAlreadyExists);
      assertEquals(
        gotrue.called("DELETE", "/admin/users/user-1"),
        0,
        "the existing account must never be deleted",
      );
      assertEquals(rest.rows("internal_t__app_users").length, 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("social: an insert failure does delete the account it just created", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
    "DELETE /admin/users/*": () => ({ status: 200, body: {} }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const account = new UserSignUpAccount<UserSocialSignUp>();
    account.insert = () => Promise.resolve(false);

    const result = await withRequest(
      fakeDevice(),
      () => new SocialSignUp(SocialProvider.Google, account).withIdToken(SOCIAL),
    );

    assert(result instanceof Failure);
    assertEquals(gotrue.called("DELETE", "/admin/users/user-1"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "email: gotrue's anti-enumeration response is translated to `already taken`",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /signup": () => ({
        status: 200,
        body: goTrueSession({ user: goTrueUser({ id: "fake-uuid" }) }),
      }),
      "PUT /admin/users/*": () => ({
        status: 404,
        body: goTrueError("user_not_found"),
      }),
      "DELETE /admin/users/*": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const provider = new EmailSignUp(new UserSignUpAccount<UserEmailSignUp>());
      const result = await withRequest(
        fakeDevice(),
        () => provider.withEmailAndPassword(SIGN_UP),
      );

      assert(result instanceof Failure);
      assertEquals(result.error, EmailSignUpError.EmailAlreadyExists);
      assertEquals(
        gotrue.called("DELETE", "/admin/users/fake-uuid"),
        0,
        "nothing to delete: the returned identifier is a decoy",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("email: a nominal sign-up returns a device token", async () => {
  const gotrue = installGoTrueMock({
    "POST /signup": () => ({ status: 200, body: goTrueSession() }),
    "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const provider = new EmailSignUp(new UserSignUpAccount<UserEmailSignUp>());
    const result = await withRequest(
      fakeDevice(),
      () => provider.withEmailAndPassword(SIGN_UP),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assertEquals(result.data.device_token.length, 128);
    assertEquals(rest.rows("internal_t__app_users").length, 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: the password policy does apply at sign-up", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const provider = new EmailSignUp(new UserSignUpAccount<UserEmailSignUp>());
    const result = await withRequest(
      fakeDevice(),
      () => provider.withEmailAndPassword({ ...SIGN_UP, password: "short" }),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignUpError.InvalidPassword);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: the per-recipient limit is keyed on the mailbox", async () => {
  const gotrue = installGoTrueMock({
    "POST /signup": () => ({ status: 200, body: goTrueSession() }),
    "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const provider = new EmailSignUp(new UserSignUpAccount<UserEmailSignUp>());
    await withRequest(
      fakeDevice(),
      () => provider.withEmailAndPassword({ ...SIGN_UP, email: "u1+tag@example.com" }),
    );

    const recipientKeys = env.rateLimitKeys.filter((k) => k.includes(":email:to:"));
    assertEquals(recipientKeys.length, 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("email: no gotrue call when the device is missing", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const provider = new EmailSignUp(new UserSignUpAccount<UserEmailSignUp>());
    const result = await withRequest(null, () => provider.withEmailAndPassword(SIGN_UP));

    assert(result instanceof Failure);
    assertEquals(gotrue.calls.length, 0, "no account created only to be deleted right away");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
