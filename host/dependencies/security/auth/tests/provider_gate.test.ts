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

import { goTrue } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/gotrue_client.ts";
import { SocialProvider } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/primitives.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assert, assertEquals } from "@std/assert";

function withoutEnv(names: string[], body: () => Promise<void>): Promise<void> {
  const saved = names.map((name) => [name, Deno.env.get(name)] as const);
  for (const name of names) Deno.env.delete(name);
  return body().finally(() => {
    for (const [name, value] of saved) {
      if (value !== undefined) Deno.env.set(name, value);
    }
  });
}

Deno.test(
  "phone channel not configured: no network call goes out",
  async () => {
    const gotrue = installGoTrueMock({});
    try {
      await withoutEnv(
        [
          "TWILIO_ACCOUNT_SID",
          "TWILIO_AUTH_TOKEN",
          "TWILIO_MESSAGE_SERVICE_SID",
        ],
        async () => {
          const send = await goTrue.signIn.phone.send(
            "+33612345678",
            AccountRole.User,
          );
          const verify = await goTrue.signIn.phone.verify(
            "+33612345678",
            "123456",
          );
          const password = await goTrue.signIn.phone.withPassword(
            "+33612345678",
            "Poppin2Alpha",
          );

          for (const result of [send, verify, password]) {
            assert(!result.ok);
            assertEquals(result.error.code, "phone_provider_not_configured");
          }
          assertEquals(gotrue.calls.length, 0);
        },
      );
    } finally {
      gotrue.restore();
    }
  },
);

Deno.test(
  "social channel not configured: no network call goes out",
  async () => {
    const gotrue = installGoTrueMock({});
    try {
      await withoutEnv(
        ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
        async () => {
          const signIn = await goTrue.signIn.social.google.signIn(
            "id-token",
            "nonce",
          );
          const signUp = await goTrue.signUp.createUserWithGoogle(
            "id-token",
            "nonce",
          );

          for (const result of [signIn, signUp]) {
            assert(!result.ok);
            assertEquals(result.error.code, "social_provider_not_configured");
          }
          assertEquals(gotrue.calls.length, 0);
        },
      );
    } finally {
      gotrue.restore();
    }
  },
);

Deno.test("the guard is independent per provider", async () => {
  const gotrue = installGoTrueMock({});
  try {
    await withoutEnv(["APPLE_CLIENT_ID", "APPLE_CLIENT_SECRET"], async () => {
      const apple = await goTrue.signIn.social.apple.signIn(
        "id-token",
        "nonce",
      );
      assert(!apple.ok);
      assertEquals(apple.error.code, "social_provider_not_configured");

      const google = await goTrue.signIn.social.google.signIn(
        "id-token",
        "nonce",
      );
      assertEquals(
        gotrue.calls.length,
        1,
        "Google is configured, it must pass the guard",
      );
      assert(!google.ok);
      assertEquals(google.error.code, "not_mocked");
    });
  } finally {
    gotrue.restore();
  }
});

Deno.test("the nonce is mandatory in the id_token exchange", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: {} }),
  });
  try {
    await goTrue.signIn.social.google.signIn("id-token", "the-nonce");
    assertEquals(gotrue.calls[0].body?.nonce, "the-nonce");
    assertEquals(gotrue.calls[0].body?.provider, SocialProvider.Google);
  } finally {
    gotrue.restore();
  }
});

Deno.test("the sign-in OTP never creates an account", async () => {
  const gotrue = installGoTrueMock({
    "POST /otp": () => ({ status: 200, body: {} }),
  });
  try {
    await goTrue.signIn.email.otp.send("u1@example.com", AccountRole.User);
    assertEquals(gotrue.calls[0].body?.create_user, false);
  } finally {
    gotrue.restore();
  }
});

Deno.test("deleting an already absent account is a success", async () => {
  const gotrue = installGoTrueMock({
    "DELETE /admin/users/*": () => ({
      status: 404,
      body: { msg: "not found" },
    }),
  });
  try {
    const result = await goTrue.user.delete("ghost");
    assertEquals(result.ok, true);
  } finally {
    gotrue.restore();
  }
});
