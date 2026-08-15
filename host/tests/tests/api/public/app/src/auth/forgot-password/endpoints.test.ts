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

import { SendEmailResetPasswordEndpoint } from "@scribe/host/api/public/app/src/auth/forgot-password/email/send.ts";
import { ResendPhoneResetOtpEndpoint } from "@scribe/host/api/public/app/src/auth/forgot-password/phone/resend-otp.ts";
import { SendPhoneResetPasswordEndpoint } from "@scribe/host/api/public/app/src/auth/forgot-password/phone/send.ts";
import { VerifyPhoneResetOtpEndpoint } from "@scribe/host/api/public/app/src/auth/forgot-password/phone/verify-otp.ts";
import { SetPasswordEndpoint } from "@scribe/host/api/public/app/src/auth/forgot-password/set-password.ts";
import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { PendingTokenPurpose } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueError, goTrueSession, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { assert, assertEquals } from "@std/assert";
import { forgeToken } from "@scribe/host/dependencies/security/auth/testing/pending_token.ts";

const EMAIL = "u1@example.com";
const PHONE = "+33612345678";
const OTP = "123456";
const STRONG = "NewPassw0rd";

function appUsers() {
  return [{ user_id: "user-1", email: EMAIL, phone: PHONE }];
}

function verifiedSession() {
  return goTrueSession({
    user: {
      id: "user-1",
      phone: PHONE,
      app_metadata: { role: AccountRole.User },
    },
  });
}

Deno.test("POST /email/send: a known address gets a generic 200", async () => {
  const gotrue = installGoTrueMock({
    "POST /recover": () => ({ status: 200, body: {} }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => SendEmailResetPasswordEndpoint.handle(),
      { email: EMAIL },
    );

    assertEquals(res.status, 200);
    assertEquals(gotrue.called("POST", "/recover"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "POST /email/send: an unknown address is indistinguishable",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /recover": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const known = await callEndpoint(
        () => SendEmailResetPasswordEndpoint.handle(),
        { email: EMAIL },
      );
      const unknown = await callEndpoint(
        () => SendEmailResetPasswordEndpoint.handle(),
        { email: "nobody@example.com" },
      );

      assertEquals(known.status, unknown.status);
      assertEquals(known.body.message, unknown.body.message);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("POST /email/send: a missing body is a 400", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => SendEmailResetPasswordEndpoint.handle(),
      {},
    );

    assertEquals(res.status, 400);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "POST /phone/send: a valid number triggers one sms and a generic 200",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /otp": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => SendPhoneResetPasswordEndpoint.handle(),
        { phone: PHONE },
      );

      assertEquals(res.status, 200);
      assertEquals(gotrue.called("POST", "/otp"), 1);
      assertEquals(gotrue.calls[0].body?.create_user, false);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /phone/send: an invalid number is a 400 with no sms",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => SendPhoneResetPasswordEndpoint.handle(),
        { phone: "123" },
      );

      assertEquals(res.status, 400);
      assertEquals(res.body.code, "invalid_phone");
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("POST /phone/send: a saturated caller gets a 429", async () => {
  const gotrue = installGoTrueMock({
    "POST /otp": () => ({ status: 200, body: {} }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();
  env.block("SendPhoneResetPasswordEndpoint");

  try {
    const res = await callEndpoint(
      () => SendPhoneResetPasswordEndpoint.handle(),
      { phone: PHONE },
    );

    assertEquals(res.status, 429);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "POST /phone/resend-otp: resends without consuming the send budget",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /otp": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();
    env.block("SendPhoneResetPasswordEndpoint");

    try {
      const res = await callEndpoint(
        () => ResendPhoneResetOtpEndpoint.handle(),
        { phone: PHONE },
      );

      assertEquals(
        res.status,
        200,
        "the resend endpoint has its own bucket: a saturated send must not block it",
      );
      assertEquals(gotrue.called("POST", "/otp"), 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /phone/verify-otp: a valid otp returns a token, never a session",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /verify": () => ({ status: 200, body: verifiedSession() }),
      "POST /logout*": () => ({ status: 204 }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => VerifyPhoneResetOtpEndpoint.handle(),
        { phone: PHONE, otp: OTP },
      );

      assertEquals(res.status, 200);
      const data = res.body.data as Record<string, unknown>;
      assert(typeof data.token === "string" && data.token.length > 0);

      const serialized = JSON.stringify(res.body);
      assert(
        !serialized.includes("access_token") &&
          !serialized.includes("refresh_token"),
        "the response must never carry a session",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("POST /phone/verify-otp: a wrong otp is a 400", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 403, body: goTrueError("otp_expired") }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => VerifyPhoneResetOtpEndpoint.handle(), {
      phone: PHONE,
      otp: OTP,
    });

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_or_expired");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "POST /phone/verify-otp: a missing otp is a 400 before gotrue",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => VerifyPhoneResetOtpEndpoint.handle(),
        { phone: PHONE },
      );

      assertEquals(res.status, 400);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("POST /set-password: a fresh token sets the password", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const token = await forgeToken(EMAIL, AccountRole.User, { purpose: PendingTokenPurpose.PasswordReset });
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [
      { token_hash: await sha256Hex(token), expires_at: Date.now() + 600_000 },
    ],
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => SetPasswordEndpoint.handle(), {
      token,
      new_password: STRONG,
      confirm_new_password: STRONG,
    });

    assertEquals(res.status, 200);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("POST /set-password: an unknown token is a 401", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => SetPasswordEndpoint.handle(), {
      token: "forged",
      new_password: STRONG,
      confirm_new_password: STRONG,
    });

    assertEquals(res.status, 401);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "POST /set-password: a bearer session is not an authorization",
  async () => {
    const gotrue = installGoTrueMock({
      "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
    });
    const rest = installRestMock({ internal_t__app_users: appUsers() });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => SetPasswordEndpoint.handle(),
        { token: "", new_password: STRONG, confirm_new_password: STRONG },
        { headers: { Authorization: "Bearer a-perfectly-valid-session" } },
      );

      assertEquals(
        res.status,
        400,
        "holding a session must never be enough to reset a password without the current one",
      );
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("POST /set-password: mismatched passwords are a 400", async () => {
  const gotrue = installGoTrueMock({});
  const token = await forgeToken(EMAIL, AccountRole.User, { purpose: PendingTokenPurpose.PasswordReset });
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [
      { token_hash: await sha256Hex(token), expires_at: Date.now() + 600_000 },
    ],
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => SetPasswordEndpoint.handle(), {
      token,
      new_password: STRONG,
      confirm_new_password: "Different0ne",
    });

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "passwords_do_not_match");
    assertEquals(
      rest.rows("internal_t__otp_pending_tokens").length,
      1,
      "a typo must not burn the token",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("POST /set-password: a weak password is a 400", async () => {
  const gotrue = installGoTrueMock({
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const token = await forgeToken(EMAIL, AccountRole.User, { purpose: PendingTokenPurpose.PasswordReset });
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__otp_pending_tokens: [
      { token_hash: await sha256Hex(token), expires_at: Date.now() + 600_000 },
    ],
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => SetPasswordEndpoint.handle(), {
      token,
      new_password: "short",
      confirm_new_password: "short",
    });

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_password");
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("the sms branch runs from send to set-password", async () => {
  const gotrue = installGoTrueMock({
    "POST /otp": () => ({ status: 200, body: {} }),
    "POST /verify": () => ({ status: 200, body: verifiedSession() }),
    "POST /logout*": () => ({ status: 204 }),
    "PUT /admin/users/*": () => ({ status: 200, body: { id: "user-1" } }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const sent = await callEndpoint(
      () => SendPhoneResetPasswordEndpoint.handle(),
      { phone: PHONE },
    );
    assertEquals(sent.status, 200);

    const verified = await callEndpoint(
      () => VerifyPhoneResetOtpEndpoint.handle(),
      { phone: PHONE, otp: OTP },
    );
    assertEquals(verified.status, 200);
    const token = (verified.body.data as Record<string, string>).token;

    const done = await callEndpoint(() => SetPasswordEndpoint.handle(), {
      token,
      new_password: STRONG,
      confirm_new_password: STRONG,
    });

    assertEquals(done.status, 200);
    assertEquals(gotrue.called("PUT", "/admin/users/user-1"), 1);

    const replay = await callEndpoint(() => SetPasswordEndpoint.handle(), {
      token,
      new_password: STRONG,
      confirm_new_password: STRONG,
    });
    assertEquals(replay.status, 401, "the token is spent");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
