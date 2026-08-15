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

import { SendEmailResetPasswordEndpoint } from "@scribe/host/api/public/admin/src/auth/forgot-password/email/send.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { assertEquals } from "@std/assert";

const ADMIN_ID = "admin-1";
const ADMIN_EMAIL = "admin@example.com";

function adminUsers() {
  return [{ admin_id: ADMIN_ID, email: ADMIN_EMAIL, phone: null }];
}

// --- POST /auth/reset-password/email/send ------------------------------------

Deno.test(
  "POST /email/send: a known admin address triggers one recovery mail",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /recover": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({ internal_t__admin_users: adminUsers() });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => SendEmailResetPasswordEndpoint.handle(),
        { email: ADMIN_EMAIL },
      );

      assertEquals(res.status, 200);
      assertEquals(gotrue.called("POST", "/recover"), 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /email/send: an unknown address is indistinguishable from a known one",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /recover": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({ internal_t__admin_users: adminUsers() });
    const env = installAuthEnv();

    try {
      const known = await callEndpoint(
        () => SendEmailResetPasswordEndpoint.handle(),
        { email: ADMIN_EMAIL },
      );
      const unknown = await callEndpoint(
        () => SendEmailResetPasswordEndpoint.handle(),
        { email: "nobody@example.com" },
      );

      assertEquals(
        known.status,
        unknown.status,
        "a differing status turns this endpoint into an admin address oracle",
      );
      assertEquals(known.body.message, unknown.body.message);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("POST /email/send: a malformed address is a 400", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__admin_users: adminUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => SendEmailResetPasswordEndpoint.handle(),
      { email: "not-an-email" },
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_email");
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("POST /email/send: a missing body is a 400", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__admin_users: adminUsers() });
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
  "POST /email/send: the admin channel asks gotrue for the admin role",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /recover": () => ({ status: 200, body: {} }),
    });
    const rest = installRestMock({ internal_t__admin_users: adminUsers() });
    const env = installAuthEnv();

    try {
      await callEndpoint(() => SendEmailResetPasswordEndpoint.handle(), {
        email: ADMIN_EMAIL,
      });

      const call = gotrue.calls.find((c) => c.path === "/recover");
      assertEquals(
        (call?.body as { data?: { role?: string } } | undefined)?.data?.role,
        AccountRole.Admin,
        "without the admin role the mail is built from the app template and links to the app domain",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);
