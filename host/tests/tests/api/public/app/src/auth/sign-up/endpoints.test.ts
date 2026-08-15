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

import { SignUpWithAppleEndpoint } from "@scribe/host/api/public/app/src/auth/sign-up/social/with-apple.ts";
import { SignUpWithGoogleEndpoint } from "@scribe/host/api/public/app/src/auth/sign-up/social/with-google.ts";
import { SignUpEndpoint } from "@scribe/host/api/public/app/src/auth/sign-up/with-email-and-password.ts";
import { SignUpWithPhoneEndpoint } from "@scribe/host/api/public/app/src/auth/sign-up/with-phone.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import {
  goTrueError,
  goTrueSession,
  goTrueUser,
  installGoTrueMock,
} from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { assert, assertEquals } from "@std/assert";

const EMAIL = "u1@example.com";
const PHONE = "+33612345678";
const PASSWORD = "Poppin2Alpha";
const USER = { opaque: "payload", the_kernel: "never reads this" };

function nominalRoutes() {
  return {
    "POST /signup": () => ({ status: 200, body: goTrueSession() }),
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "PUT /admin/users/*": () => ({ status: 200, body: goTrueUser() }),
    "DELETE /admin/users/*": () => ({ status: 200, body: {} }),
  };
}

function deviceToken(body: Record<string, unknown>): string {
  return (body.data as Record<string, string>).device_token;
}

Deno.test(
  "POST /sign-up/with-email-and-password: a nominal sign-up returns a device token",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
        user: USER,
      });

      assertEquals(res.status, 200);
      assertEquals(deviceToken(res.body).length, 128);
      assertEquals(rest.rows("internal_t__app_users").length, 1);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-email-and-password: an existing email is indistinguishable from a new one",
  async () => {
    const gotrue = installGoTrueMock({
      ...nominalRoutes(),
      "PUT /admin/users/*": () => ({
        status: 404,
        body: goTrueError("user_not_found"),
      }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
        user: USER,
      });

      assertEquals(
        res.status,
        200,
        "a taken email must not be an error status",
      );
      assertEquals(
        deviceToken(res.body).length,
        128,
        "the decoy must be shaped exactly like a real device token, or its absence leaks the account",
      );
      assertEquals(
        rest.rows("internal_t__app_users").length,
        0,
        "the decoy is never persisted: it must validate no device",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-email-and-password: the decoy differs on every call",
  async () => {
    const gotrue = installGoTrueMock({
      ...nominalRoutes(),
      "PUT /admin/users/*": () => ({
        status: 404,
        body: goTrueError("user_not_found"),
      }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const first = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
        user: USER,
      });
      const second = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
        user: USER,
      });

      assert(
        deviceToken(first.body) !== deviceToken(second.body),
        "a constant decoy would be trivially fingerprintable",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-email-and-password: a weak password is a 400 before gotrue",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: "weak",
        user: USER,
      });

      assertEquals(res.status, 400);
      assertEquals(res.body.code, "invalid_password");
      assertEquals(
        gotrue.calls.length,
        0,
        "no account created only to be deleted right away",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-email-and-password: an invalid email is a 400",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: "not-an-address",
        password: PASSWORD,
        user: USER,
      });

      assertEquals(res.status, 400);
      assertEquals(res.body.code, "invalid_email");
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-email-and-password: the user payload is mandatory",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
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
  "POST /sign-up/with-email-and-password: a saturated caller gets a 429",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();
    env.block("SignUpEndpoint");

    try {
      const res = await callEndpoint(() => SignUpEndpoint.handle(), {
        email: EMAIL,
        password: PASSWORD,
        user: USER,
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
  "POST /sign-up/with-email-and-password: no device means no account is created",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => SignUpEndpoint.handle(),
        { email: EMAIL, password: PASSWORD, user: USER },
        { device: null },
      );

      assert(res.status >= 400);
      assertEquals(gotrue.calls.length, 0);
      assertEquals(rest.rows("internal_t__app_users").length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-phone: a nominal sign-up returns a device token",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithPhoneEndpoint.handle(), {
        phone: PHONE,
        password: PASSWORD,
        user: USER,
      });

      assertEquals(res.status, 200);
      assertEquals(deviceToken(res.body).length, 128);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-phone: an sms sign-up is created unconfirmed",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      await callEndpoint(() => SignUpWithPhoneEndpoint.handle(), {
        phone: PHONE,
        password: PASSWORD,
        user: USER,
      });

      const signup = gotrue.calls.find((c) => c.path === "/signup");
      assertEquals(signup?.body?.channel, "sms");
      assertEquals(signup?.body?.phone, PHONE);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/with-phone: an invalid number is a 400 before gotrue",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithPhoneEndpoint.handle(), {
        phone: "123",
        password: PASSWORD,
        user: USER,
      });

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

Deno.test(
  "POST /sign-up/with-phone: a taken number also gets a decoy, not an error",
  async () => {
    const gotrue = installGoTrueMock({
      ...nominalRoutes(),
      "PUT /admin/users/*": () => ({
        status: 404,
        body: goTrueError("user_not_found"),
      }),
    });
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithPhoneEndpoint.handle(), {
        phone: PHONE,
        password: PASSWORD,
        user: USER,
      });

      assertEquals(
        res.status,
        200,
        "a number is at least as enumerable as an address: same treatment",
      );
      assertEquals(deviceToken(res.body).length, 128);
      assertEquals(rest.rows("internal_t__app_users").length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/social/with-google: a nominal sign-up returns a device token",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithGoogleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
        user: USER,
      });

      assertEquals(res.status, 200);
      assertEquals(deviceToken(res.body).length, 128);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/social/with-google: an existing account is a 409, not a decoy",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({
      internal_t__app_users: [
        { user_id: "user-1", email: EMAIL, phone: PHONE },
      ],
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithGoogleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
        user: USER,
      });

      assertEquals(
        res.status,
        409,
        "a valid id_token already proves ownership: there is nothing to hide from this caller",
      );
      assertEquals(res.body.code, "account_already_exists");
      assertEquals(
        gotrue.called("DELETE", "/admin/users/user-1"),
        0,
        "the pre-existing account must never be deleted by a second sign-up",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /sign-up/social/with-google: the nonce is mandatory",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithGoogleEndpoint.handle(), {
        id_token: "id-token",
        user: USER,
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
  "POST /sign-up/social/with-google: the user payload is mandatory",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithGoogleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
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
  "POST /sign-up/social/with-apple: access_token stays optional",
  async () => {
    const gotrue = installGoTrueMock(nominalRoutes());
    const rest = installRestMock({});
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(() => SignUpWithAppleEndpoint.handle(), {
        id_token: "id-token",
        nonce: "nonce",
        access_token: "apple-access",
        user: USER,
      });

      assertEquals(res.status, 200);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);
