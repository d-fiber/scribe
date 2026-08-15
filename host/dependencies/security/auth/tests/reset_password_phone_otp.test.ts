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

import { PendingToken, PendingTokenPurpose } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import {
  PhoneResetPassword,
  VerifyPhoneResetOtpError,
} from "@scribe/host/dependencies/security/auth/src/reset_password/providers/phone.ts";
import { auth, SmsIntent } from "@scribe/host/dependencies/security/auth/src/client.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueError, goTrueSession, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";

const PHONE = "+33612345678";
const OTP = "123456";

function verifiedSession() {
  return goTrueSession({
    user: { id: "user-1", phone: PHONE, app_metadata: { role: AccountRole.User } },
  });
}

Deno.test("phone verify: a valid otp yields a reset token, never a session", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 200, body: verifiedSession() }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify(PHONE, OTP),
    );

    assert(result instanceof OK, "a matching otp must succeed");
    const body = JSON.stringify(result.data);
    assert(
      !body.includes("access-token") && !body.includes("refresh-token"),
      "the gotrue session must never reach the caller: phone + otp would become a full sign-in",
    );

    const payload = await new PendingToken(PendingTokenPurpose.PasswordReset)
      .payload(result.data.resetToken);
    assertEquals(payload?.identifier, PHONE);
    assertEquals(payload?.role, AccountRole.User);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: the session minted by gotrue is revoked on the spot", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 200, body: verifiedSession() }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify(PHONE, OTP),
    );

    assertEquals(
      gotrue.called("POST", "/logout"),
      1,
      "verifying an otp always mints a session server-side; leaving it alive is a standing bypass",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: a malformed otp never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const provider = new PhoneResetPassword(AccountRole.User);
    for (const bad of ["", "12345", "1234567", "12345a", " 123456 "]) {
      const result = await withRequest(fakeDevice(), () => provider.verify(PHONE, bad));
      assert(result instanceof Failure, `"${bad}" must be refused`);
      assertEquals(result.error, VerifyPhoneResetOtpError.InvalidOrExpired);
    }
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: an invalid number never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify("123", OTP),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyPhoneResetOtpError.InvalidOrExpired);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: a wrong otp is rejected without a reset token", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 403, body: goTrueError("otp_expired") }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify(PHONE, OTP),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyPhoneResetOtpError.InvalidOrExpired);
    assertEquals(rest.rows("internal_t__otp_pending_tokens").length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: an admin number cannot mint a user reset token", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({
      status: 200,
      body: goTrueSession({
        user: { id: "admin-1", phone: PHONE, app_metadata: { role: AccountRole.Admin } },
      }),
    }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify(PHONE, OTP),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyPhoneResetOtpError.InvalidOrExpired);
    assertEquals(gotrue.called("POST", "/logout"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: the brute-force budget follows the number, not the caller", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 200, body: verifiedSession() }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify(PHONE, OTP),
    );

    const verifyKey = env.rateLimitKeys.find((k) => k.includes(":verify:to:"));
    assert(
      verifyKey,
      `expected a per-recipient verify bucket, got: ${env.rateLimitKeys.join(", ")}`,
    );
    assert(
      !verifyKey.includes("1.2.3.4"),
      "a 6-digit code must not be bruteforceable by rotating IPs",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone verify: a saturated number is refused before gotrue", async () => {
  const gotrue = installGoTrueMock({
    "POST /verify": () => ({ status: 200, body: verifiedSession() }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();
  env.block(":verify:to:");

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).verify(PHONE, OTP),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyPhoneResetOtpError.TooManyRequests);
    assertEquals(gotrue.called("POST", "/verify"), 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone resend: send and resend do not share a budget", async () => {
  const gotrue = installGoTrueMock({ "POST /otp": () => ({ status: 200, body: {} }) });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const provider = new PhoneResetPassword(AccountRole.User);
    await withRequest(fakeDevice(), () => provider.send(PHONE));
    await withRequest(fakeDevice(), () => provider.resend(PHONE));

    assert(
      env.rateLimitKeys.some((k) => k.includes(":send")),
      "the first send must consume a send bucket",
    );
    assert(
      env.rateLimitKeys.some((k) => k.includes(":resend")),
      "a resend must consume its own bucket, so it does not eat the first send's budget",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone resend: a saturated send bucket does not block a resend", async () => {
  const gotrue = installGoTrueMock({ "POST /otp": () => ({ status: 200, body: {} }) });
  const rest = installRestMock({});
  const env = installAuthEnv();
  env.block("reset-password:user:send");

  try {
    const provider = new PhoneResetPassword(AccountRole.User);
    const resent = await withRequest(fakeDevice(), () => provider.resend(PHONE));

    assert(resent instanceof OK);
    assertEquals(gotrue.called("POST", "/otp"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone resend: an invalid number is refused before any send", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).resend("123"),
    );

    assert(result instanceof Failure);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone resend: the otp still never creates an account", async () => {
  const gotrue = installGoTrueMock({ "POST /otp": () => ({ status: 200, body: {} }) });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).resend(PHONE),
    );

    assertEquals(gotrue.calls[0].body?.create_user, false);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone send: the reset marks its intent so the webhook can name the sms", async () => {
  const gotrue = installGoTrueMock({ "POST /otp": () => ({ status: 200, body: {} }) });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).send(PHONE),
    );

    assertEquals(
      await auth.smsIntent.consume(PHONE),
      SmsIntent.ResetPassword,
      "gotrue sends the same POST /otp for a reset and a device check: without this mark the webhook cannot tell them apart",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone send: a refused gotrue call leaves no intent behind", async () => {
  const gotrue = installGoTrueMock({
    "POST /otp": () => ({ status: 500, body: goTrueError("unexpected_failure") }),
  });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).send(PHONE),
    );

    assertEquals(
      await auth.smsIntent.consume(PHONE),
      null,
      "a stale mark would relabel the next unrelated otp sent to this number",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("phone send: the intent is single use", async () => {
  const gotrue = installGoTrueMock({ "POST /otp": () => ({ status: 200, body: {} }) });
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).send(PHONE),
    );

    assertEquals(await auth.smsIntent.consume(PHONE), SmsIntent.ResetPassword);
    assertEquals(
      await auth.smsIntent.consume(PHONE),
      null,
      "the second sms to this number must fall back to the phone_confirmed_at heuristic",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
