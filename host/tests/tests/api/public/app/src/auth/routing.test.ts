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

import { AuthRouter } from "@scribe/host/api/public/app/src/auth/router.ts";
import { UserRouter } from "@scribe/host/api/public/app/src/user/router.ts";
import { Hono } from "hono";
import { assertEquals } from "@std/assert";

function tableOf(app: Hono): string[] {
  return app.routes
    .filter((route) => route.method !== "ALL")
    .map((route) => `${route.method} ${route.path}`)
    .sort();
}

function routes(): string[] {
  return tableOf(AuthRouter.create());
}

function userRoutes(): string[] {
  return tableOf(UserRouter.create());
}

Deno.test("routing: the sign-in surface is split by channel family", () => {
  const table = routes();

  assertEquals(
    table.filter((r) => r.includes("/sign-in/")),
    [
      "POST /sign-in/email/resend-otp",
      "POST /sign-in/email/verify-otp",
      "POST /sign-in/email/with-email-and-password",
      "POST /sign-in/phone/resend-otp",
      "POST /sign-in/phone/verify-otp",
      "POST /sign-in/phone/with-phone-and-password",
      "POST /sign-in/social/with-apple",
      "POST /sign-in/social/with-google",
    ],
  );
});

Deno.test("routing: sign-up keeps its flat channels and groups social", () => {
  const table = routes();

  assertEquals(
    table.filter((r) => r.includes("/sign-up/")),
    [
      "POST /sign-up/social/with-apple",
      "POST /sign-up/social/with-google",
      "POST /sign-up/with-email-and-password",
      "POST /sign-up/with-phone",
    ],
  );
});

Deno.test(
  "routing: the reset-password surface exposes both channels and the completion",
  () => {
    const table = routes();

    assertEquals(
      table.filter((r) => r.includes("/reset-password")),
      [
        "POST /reset-password/email/send",
        "POST /reset-password/phone/resend-otp",
        "POST /reset-password/phone/send",
        "POST /reset-password/phone/verify-otp",
        "POST /reset-password/set-password",
      ],
    );
  },
);

Deno.test(
  "routing: the folder is forgot-password but the mount is reset-password",
  () => {
    const table = routes();

    assertEquals(
      table.filter((r) => r.includes("/forgot-password")),
      [],
      "the code lives under forgot-password/, but AuthRouter mounts it on /reset-password",
    );
  },
);

Deno.test("routing: /auth/user keeps only what a broken session still needs", () => {
  assertEquals(
    routes().filter((r) => r.includes("/user")),
    [
      "POST /user/recover-session",
      "POST /user/refresh-session",
    ],
    "everything requiring a live session moved under /user, which is mounted behind userOnly",
  );
});

Deno.test("routing: the /user surface is exactly the generic one", () => {
  assertEquals(
    userRoutes(),
    [
      "DELETE /account/devices/:deviceId",
      "DELETE /account/identities/:identityId",
      "DELETE /support/issue",
      "GET /account/devices",
      "GET /account/devices/current",
      "GET /account/identities",
      "PATCH /account/update/email",
      "PATCH /account/update/phone",
      "PATCH /preferences/appearance/theme-mode",
      "PATCH /preferences/localization/localization",
      "POST /account/delete-account",
      "POST /account/sign-out",
      "POST /account/update/password",
      "POST /account/update/phone/verify-otp",
      "POST /support/feedback",
      "POST /support/issue",
      "POST /support/issue/pagination",
    ],
    "exhaustive on purpose: any route mounted here that is not generic fails the assertion, without this file having to know a single project path",
  );
});

Deno.test("routing: no legacy pre-split path survives", () => {
  const table = routes();
  const gone = [
    "POST /sign-in/with-email-and-password",
    "POST /sign-in/verify-otp",
    "POST /sign-in/resend-otp",
    "POST /sign-in/verify-phone-otp",
    "POST /sign-in/resend-phone-otp",
    "POST /sign-in/with-google",
    "POST /sign-in/with-apple",
    "POST /sign-up/with-google",
    "POST /sign-up/with-apple",
    "POST /reset-password/with-email",
  ];

  for (const path of gone) {
    assertEquals(
      table.includes(path),
      false,
      `${path} was renamed by the family split and must not still be mounted`,
    );
  }
});

Deno.test("routing: every mounted path is unique", () => {
  const table = routes();
  assertEquals(
    table.length,
    new Set(table).size,
    "two handlers on the same path means one silently shadows the other",
  );
});
