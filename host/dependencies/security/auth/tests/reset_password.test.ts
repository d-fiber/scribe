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
  EmailResetPassword,
  EmailResetPasswordError,
} from "@scribe/host/dependencies/security/auth/src/reset_password/providers/email.ts";
import {
  PhoneResetPassword,
  PhoneResetPasswordError,
} from "@scribe/host/dependencies/security/auth/src/reset_password/providers/phone.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueError, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("email: a known address gets a recovery mail", async () => {
  const gotrue = installGoTrueMock({ "POST /recover": () => ({ status: 200, body: {} }) });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new EmailResetPassword(AccountRole.User).send("u1@example.com"),
    );
    assert(result instanceof OK);
    assertEquals(gotrue.called("POST", "/recover"), 1);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test(
  "email: gotrue's send limit does not leak account existence",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /recover": () => ({
        status: 429,
        body: goTrueError("over_email_send_rate_limit"),
      }),
    });
    const database = installDatabaseMock({});
    const env = installAuthEnv();

    try {
      const result = await withRequest(
        fakeDevice(),
        () => new EmailResetPassword(AccountRole.User).send("u1@example.com"),
      );

      assert(
        result instanceof OK,
        "a 429 from gotrue only exists for a real account: it must not surface",
      );
    } finally {
      env.restore();
      database.restore();
      gotrue.restore();
    }
  },
);

Deno.test("email: an unknown address is indistinguishable from a known one", async () => {
  const gotrue = installGoTrueMock({ "POST /recover": () => ({ status: 200, body: {} }) });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const known = await withRequest(
      fakeDevice(),
      () => new EmailResetPassword(AccountRole.User).send("u1@example.com"),
    );
    const unknown = await withRequest(
      fakeDevice(),
      () => new EmailResetPassword(AccountRole.User).send("nobody@example.com"),
    );
    assertEquals(known.ok, unknown.ok);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("email: invalid input is refused before any send", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const provider = new EmailResetPassword(AccountRole.User);
    const empty = await withRequest(fakeDevice(), () => provider.send("  "));
    const invalid = await withRequest(fakeDevice(), () => provider.send("not-an-address"));

    assert(empty instanceof Failure);
    assertEquals(empty.error, EmailResetPasswordError.EmailRequired);
    assert(invalid instanceof Failure);
    assertEquals(invalid.error, EmailResetPasswordError.InvalidEmail);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("email: the recipient limit carries the role and the mailbox", async () => {
  const gotrue = installGoTrueMock({ "POST /recover": () => ({ status: 200, body: {} }) });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new EmailResetPassword(AccountRole.Admin).send("a1+tag@example.com"),
    );

    const inbox = await sha256Hex("a1@example.com");
    assertEquals(
      env.rateLimitKeys.includes(`reset-password:email:admin:to:${inbox}`),
      true,
      `recipient key missing: ${env.rateLimitKeys.join(", ")}`,
    );
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("email: admin and user do not share a recipient bucket", async () => {
  const gotrue = installGoTrueMock({ "POST /recover": () => ({ status: 200, body: {} }) });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new EmailResetPassword(AccountRole.Admin).send("x@example.com"),
    );
    await withRequest(
      fakeDevice(),
      () => new EmailResetPassword(AccountRole.User).send("x@example.com"),
    );

    const recipientKeys = env.rateLimitKeys.filter((k) => k.includes(":to:"));
    assertEquals(new Set(recipientKeys).size, 2);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("phone: an sms send limit does not leak account existence either", async () => {
  const gotrue = installGoTrueMock({
    "POST /otp": () => ({ status: 429, body: goTrueError("over_sms_send_rate_limit") }),
  });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).send("+33612345678"),
    );
    assert(result instanceof OK);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("phone: the otp never creates an account on the reset path", async () => {
  const gotrue = installGoTrueMock({ "POST /otp": () => ({ status: 200, body: {} }) });
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    await withRequest(
      fakeDevice(),
      () => new PhoneResetPassword(AccountRole.User).send("+33612345678"),
    );
    assertEquals(gotrue.calls[0].body?.create_user, false);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});

Deno.test("phone: an invalid number is refused before any send", async () => {
  const gotrue = installGoTrueMock({});
  const database = installDatabaseMock({});
  const env = installAuthEnv();

  try {
    const provider = new PhoneResetPassword(AccountRole.User);
    const empty = await withRequest(fakeDevice(), () => provider.send("   "));
    const invalid = await withRequest(fakeDevice(), () => provider.send("123"));

    assert(empty instanceof Failure);
    assertEquals(empty.error, PhoneResetPasswordError.PhoneRequired);
    assert(invalid instanceof Failure);
    assertEquals(invalid.error, PhoneResetPasswordError.InvalidPhone);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    database.restore();
    gotrue.restore();
  }
});
