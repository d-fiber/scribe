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

import { ResendEmailOtpEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/email/resend-otp.ts";
import { VerifyEmailOtpEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/email/verify-otp.ts";
import { SignInWithEmailEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/email/with-email-and-password.ts";
import { ResendPhoneOtpEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/phone/resend-otp.ts";
import { VerifyPhoneOtpEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/phone/verify-otp.ts";
import { SignInWithPhoneEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/phone/with-phone-and-password.ts";
import { SignInWithAppleEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/social/with-apple.ts";
import { SignInWithGoogleEndpoint } from "@scribe/host/api/public/app/src/auth/sign-in/social/with-google.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { PendingToken, PendingTokenPurpose } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueError, goTrueSession, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";
import { forgeToken, issueToken } from "@scribe/host/dependencies/security/auth/testing/pending_token.ts";

const EMAIL = "u1@example.com";
const PHONE = "+33612345678";
const PASSWORD = "Poppin2Alpha";
const OTP = "123456";
const DEVICE_TOKEN = "a".repeat(128);

async function trustedDevice() {
  return [
    {
      id: "row-1",
      user_id: "user-1",
      device_id: "device-1",
      hash: await sha256Hex(DEVICE_TOKEN),
      trusted_at: Date.now(),
    },
  ];
}

function trustedRequestDevice() {
  return fakeDevice({ device_token: DEVICE_TOKEN } as never);
}

Deno.test(
  "POST /sign-in/email/with-email-and-password: an unknown device gets an otp challenge",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "POST /otp": () => ({ status: 200, body: {} }),
      "POST /logout*": () => ({ status: 204 }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithEmailEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
      });

      assertEquals(res.status, 200);
      assertEquals(res.body.code, "requires_otp");

      const serialized = JSON.stringify(res.body);
      assert(
        !serialized.includes("access_token") &&
          !serialized.includes("refresh_token"),
        "an otp challenge must never ship the password session alongside it",
      );
      assertEquals(gotrue.called("POST", "/logout"), 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/with-email-and-password: a trusted device gets the session",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    });
    const rest = installRestMock({
      internal_t__app_user_devices: await trustedDevice(),
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => SignInWithEmailEndpoint.handle(),
        { email: EMAIL, password: PASSWORD },
        { device: trustedRequestDevice() },
      );

      assertEquals(res.status, 200);
      assert(res.body.code !== "requires_otp");
      assertEquals(gotrue.called("POST", "/otp"), 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/with-email-and-password: bad credentials are a 401",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({
        status: 400,
        body: goTrueError("invalid_credentials"),
      }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithEmailEndpoint.handle(), {
        email: EMAIL,
        password: "Wrongpass1",
      });

      assertEquals(res.status, 401);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/with-email-and-password: an unconfirmed email is a 403",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({
        status: 400,
        body: goTrueError("email_not_confirmed"),
      }),
      "POST /resend": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithEmailEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
      });

      assertEquals(res.status, 403);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/with-email-and-password: a missing field is a 400",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const noPassword = await callEndpoint(
        () => SignInWithEmailEndpoint.handle(),
        { email: EMAIL },
      );
      const noEmail = await callEndpoint(
        () => SignInWithEmailEndpoint.handle(),
        { password: PASSWORD },
      );

      assertEquals(noPassword.status, 400);
      assertEquals(noEmail.status, 400);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/with-email-and-password: a saturated caller gets a 429",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();
    env.block("SignInWithEmailEndpoint");

    try {
      const res = await callEndpoint(() => SignInWithEmailEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
      });

      assertEquals(res.status, 429);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/verify-otp: a valid otp returns the session",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /verify": () => ({ status: 200, body: goTrueSession() }),
    });
    const token = await forgeToken(EMAIL, AccountRole.User, { deviceId: "device-1" });
    const rest = installRestMock({
      internal_t__app_users: [
        { user_id: "user-1", email: EMAIL, phone: PHONE },
      ],
      internal_t__otp_pending_tokens: [
        {
          token_hash: await sha256Hex(token),
          expires_at: Date.now() + 600_000,
        },
      ],
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => VerifyEmailOtpEndpoint.handle(), {
        token,
        otp: OTP,
      });

      assertEquals(res.status, 200);
      const data = res.body.data as Record<string, unknown>;
      assertEquals(typeof data.access_token, "string");
      assertEquals(typeof data.device_token, "string");
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/verify-otp: a password-reset token is refused",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /verify": () => ({ status: 200, body: goTrueSession() }),
    });
    const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
    const env = installAuthEnv();

    const foreign = await issueToken(
      new PendingToken(PendingTokenPurpose.PasswordReset),
      EMAIL,
      AccountRole.User,
      "device-1",
    );

    try {
      const res = await callEndpoint(() => VerifyEmailOtpEndpoint.handle(), {
        token: foreign,
        otp: OTP,
      });

      assertEquals(
        res.status,
        400,
        "PENDING_TOKEN_SECRET is shared: a reset token must not open a sign-in",
      );
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/verify-otp: a token bound to another device is refused",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /verify": () => ({ status: 200, body: goTrueSession() }),
    });
    const token = await forgeToken(EMAIL, AccountRole.User, { deviceId: "another-device" });
    const rest = installRestMock({
      internal_t__otp_pending_tokens: [
        {
          token_hash: await sha256Hex(token),
          expires_at: Date.now() + 600_000,
        },
      ],
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => VerifyEmailOtpEndpoint.handle(), {
        token,
        otp: OTP,
      });

      assertEquals(res.status, 400);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/verify-otp: a garbage token is a 400",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => VerifyEmailOtpEndpoint.handle(), {
        token: "forged",
        otp: OTP,
      });

      assertEquals(res.status, 400);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/resend-otp: a valid token yields a fresh one",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /otp": () => ({ status: 200, body: {} }),
    });
    const token = await forgeToken(EMAIL, AccountRole.User, { deviceId: "device-1" });
    const rest = installRestMock({
      internal_t__app_users: [
        {
          user_id: "user-1",
          email: EMAIL,
          phone: PHONE,
          is_email_verified: true,
        },
      ],
      internal_t__otp_pending_tokens: [
        {
          token_hash: await sha256Hex(token),
          expires_at: Date.now() + 600_000,
        },
      ],
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => ResendEmailOtpEndpoint.handle(), {
        token,
      });

      assertEquals(res.status, 200);
      const data = res.body.data as Record<string, string>;
      assert(typeof data.token === "string");
      assert(data.token !== token, "a resend must rotate the pending token");
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/email/resend-otp: an unknown token is a 401",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => ResendEmailOtpEndpoint.handle(), {
        token: "forged",
      });

      assertEquals(res.status, 401);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/phone/with-phone-and-password: an unknown device gets an otp challenge",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "POST /otp": () => ({ status: 200, body: {} }),
      "POST /logout*": () => ({ status: 204 }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithPhoneEndpoint.handle(), {
        phone: PHONE,
        password: PASSWORD,
      });

      assertEquals(res.status, 200);
      assertEquals(res.body.code, "requires_otp");
      assertEquals(gotrue.called("POST", "/logout"), 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/phone/with-phone-and-password: an unconfirmed phone is a 403",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({
        status: 400,
        body: goTrueError("phone_not_confirmed"),
      }),
      "POST /resend": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithPhoneEndpoint.handle(), {
        phone: PHONE,
        password: PASSWORD,
      });

      assertEquals(res.status, 403);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/phone/with-phone-and-password: bad credentials are a 401",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({
        status: 400,
        body: goTrueError("invalid_credentials"),
      }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithPhoneEndpoint.handle(), {
        phone: PHONE,
        password: "Wrongpass1",
      });

      assertEquals(res.status, 401);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/phone/verify-otp: a sign-in token on the phone channel works",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /verify": () => ({ status: 200, body: goTrueSession() }),
    });
    const token = await forgeToken(PHONE, AccountRole.User, { deviceId: "device-1" });
    const rest = installRestMock({
      internal_t__app_users: [
        { user_id: "user-1", email: EMAIL, phone: PHONE },
      ],
      internal_t__otp_pending_tokens: [
        {
          token_hash: await sha256Hex(token),
          expires_at: Date.now() + 600_000,
        },
      ],
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => VerifyPhoneOtpEndpoint.handle(), {
        token,
        otp: OTP,
      });

      assertEquals(res.status, 200);
      assertEquals(
        typeof (res.body.data as Record<string, unknown>).access_token,
        "string",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/phone/verify-otp: a missing otp is a 400",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => VerifyPhoneOtpEndpoint.handle(), {
        token: "whatever",
      });

      assertEquals(res.status, 400);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/phone/resend-otp: an unknown token is a 401",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => ResendPhoneOtpEndpoint.handle(), {
        token: "forged",
      });

      assertEquals(res.status, 401);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/social/with-google: a valid id_token returns a session AND registers the device",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    });
    const rest = installRestMock({
      internal_t__app_users: [
        { user_id: "user-1", email: EMAIL, phone: PHONE },
      ],
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithGoogleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
      });

      assertEquals(res.status, 200);
      assertEquals(gotrue.called("POST", "/logout"), 0);

      const data = res.body.data as Record<string, unknown>;
      assertEquals(
        typeof data.device_token,
        "string",
        "userOnly verifies the device on every later call: a social sign-in that registers none locks the account out",
      );
      assertEquals(rest.rows("internal_t__app_user_devices").length, 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/social/with-google: the nonce is mandatory",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithGoogleEndpoint.handle(), {
        id_token: "id-token",
      });

      assertEquals(
        res.status,
        400,
        "without a nonce gotrue cannot bind the id_token to this attempt",
      );
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/social/with-google: a rejected id_token is a 401",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 400, body: goTrueError("bad_jwt") }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithGoogleEndpoint.handle(), {
        id_token: "forged",
        nonce: "nonce",
      });

      assertEquals(res.status, 401);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/social/with-apple: access_token stays optional",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    });
    const rest = installRestMock({
      internal_t__app_users: [
        { user_id: "user-1", email: EMAIL, phone: PHONE },
      ],
    });
    const env = installAuthEnv();

    try {
      const without = await callEndpoint(
        () => SignInWithAppleEndpoint.handle(),
        { id_token: "id-token", nonce: "nonce" },
      );
      const with_ = await callEndpoint(() => SignInWithAppleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
        access_token: "apple-access",
      });

      assertEquals(without.status, 200);
      assertEquals(with_.status, 200);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-in/social: an admin identity cannot sign in on the app surface",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({
        status: 200,
        body: goTrueSession({
          user: { id: "admin-1", app_metadata: { role: AccountRole.Admin } },
        }),
      }),
      "POST /logout*": () => ({ status: 204 }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignInWithGoogleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
      });

      assertEquals(res.status, 401);
      assertEquals(
        gotrue.called("POST", "/logout"),
        1,
        "the session created for the wrong role must be revoked, not merely dropped",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);
