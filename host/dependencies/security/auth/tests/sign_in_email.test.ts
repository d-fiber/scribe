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
import { EmailSignIn } from "@scribe/host/dependencies/security/auth/src/sign_in/providers/email.ts";
import { EmailSignInError } from "@scribe/host/dependencies/security/auth/src/sign_in/types.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import type { RateLimitCommands } from "@scribe/core/runtime/redis/rate_limiter/script.ts";
import { kv, type Kv } from "@scribe/core/runtime/redis/mod.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { installValkeryMock } from "@scribe/core/testing/runtime/redis.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import {
  goTrueError,
  goTrueSession,
  goTrueUser,
  installGoTrueMock,
} from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assert, assertEquals } from "@std/assert";

const DEVICE_TOKEN = "a".repeat(128);
const PASSWORD = "Poppin2Alpha";

function allowAllRateLimits() {
  const valkery = installValkeryMock();
  const check = installMock(
    kv() as unknown as RateLimitCommands,
    "rateLimitCheck",
    (() => Promise.resolve([1, 9, 0] as [number, number, number])) as unknown as RateLimitCommands["rateLimitCheck"],
  );
  const pttl = installMock(
    kv(),
    "pttl",
    (() => Promise.resolve(-2)) as unknown as Kv["pttl"],
  );
  return {
    restore: () => {
      check.restore();
      pttl.restore();
      valkery.restore();
    },
  };
}

function captureRateLimitKeys() {
  const valkery = installValkeryMock();
  const keys: string[] = [];
  const check = installMock(
    kv() as unknown as RateLimitCommands,
    "rateLimitCheck",
    ((blockedKey: string) => {
      keys.push(blockedKey.replace("rl:blocked:", ""));
      return Promise.resolve([1, 9, 0] as [number, number, number]);
    }) as unknown as RateLimitCommands["rateLimitCheck"],
  );
  const pttl = installMock(
    kv(),
    "pttl",
    (() => Promise.resolve(-2)) as unknown as Kv["pttl"],
  );
  return {
    keys,
    restore: () => {
      check.restore();
      pttl.restore();
      valkery.restore();
    },
  };
}

async function trustedDeviceRows() {
  return [{
    id: "row-1",
    user_id: "user-1",
    device_id: "device-1",
    hash: await sha256Hex(DEVICE_TOKEN),
    trusted_at: Date.now(),
  }];
}

Deno.test("trusted device: the session is returned as is, without an OTP", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const restMock = installRestMock({
    internal_t__app_user_devices: await trustedDeviceRows(),
  });
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice({ device_token: DEVICE_TOKEN }),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof OK, `expected OK, got ${JSON.stringify(result)}`);
    assert("access_token" in result.data);
    assertEquals(gotrue.called("POST", "/otp"), 0);
    assertEquals(gotrue.called("POST", "/logout"), 0);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("unknown device: OTP challenge and revocation of the password session", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "POST /otp": () => ({ status: 200, body: {} }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice({ device_token: DEVICE_TOKEN }),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof OK);
    assert("pendingToken" in result.data);
    assertEquals(gotrue.called("POST", "/otp"), 1);
    assertEquals(gotrue.called("POST", "/logout"), 1);
    assertEquals(restMock.rows("internal_t__otp_pending_tokens").length, 1);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("the pending token is never returned alongside the password session", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "POST /otp": () => ({ status: 200, body: {} }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice({ device_token: DEVICE_TOKEN }),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof OK);
    assertEquals("access_token" in result.data, false);
    assertEquals("refresh_token" in result.data, false);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("unexpected role: refused as InvalidCredentials, session revoked", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({
      status: 200,
      body: goTrueSession({
        user: goTrueUser({ app_metadata: { provider: "email", role: "user" } }),
      }),
    }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice({ device_token: DEVICE_TOKEN }),
      () => new EmailSignIn(AccountRole.Admin).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignInError.InvalidCredentials);
    assertEquals(gotrue.called("POST", "/logout"), 1);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("the password policy does not apply at sign-in", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
    "POST /otp": () => ({ status: 200, body: {} }),
    "POST /logout*": () => ({ status: 204 }),
  });
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice({ device_token: DEVICE_TOKEN }),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", "short"),
    );

    assert(result instanceof OK, "a password outside the policy must reach gotrue");
    assertEquals(gotrue.called("POST", "/token"), 1);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("empty password: refused locally, gotrue is never called", async () => {
  const gotrue = installGoTrueMock({});
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", "   "),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignInError.PasswordRequired);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("oversized password: refused before reaching bcrypt", async () => {
  const gotrue = installGoTrueMock({});
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", "x".repeat(129)),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignInError.InvalidCredentials);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("unconfirmed email: a single confirmation resend", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("email_not_confirmed") }),
    "POST /resend": () => ({ status: 200, body: {} }),
  });
  const restMock = installRestMock({});
  const limits = allowAllRateLimits();

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignInError.EmailNotConfirmed);
    assertEquals(gotrue.called("POST", "/resend"), 1);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("per-account limits are keyed on the mailbox, `+` tag stripped", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("invalid_credentials") }),
  });
  const restMock = installRestMock({});
  const limits = captureRateLimitKeys();

  try {
    await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1+promo@example.com", PASSWORD),
    );
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }

  const inbox = await sha256Hex("u1@example.com");
  assert(
    limits.keys.some((k) => k === `sign-in:user:email:to:${inbox}:1.2.3.4`),
    `caller tier missing : ${limits.keys.join(", ")}`,
  );
  assert(
    limits.keys.some((k) => k === `sign-in:user:email:to:${inbox}:all`),
    `global tier missing : ${limits.keys.join(", ")}`,
  );
});

Deno.test("a failure consumes the global tier only through the `:all` key", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("invalid_credentials") }),
  });
  const restMock = installRestMock({});
  const limits = captureRateLimitKeys();

  try {
    await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }

  const globalKeys = limits.keys.filter((k) => k.endsWith(":all"));
  assertEquals(globalKeys.length, 1);
});

function throttleWhere(isBlocked: (key: string) => boolean) {
  const valkery = installValkeryMock();
  const check = installMock(
    kv() as unknown as RateLimitCommands,
    "rateLimitCheck",
    ((blockedKey: string) =>
      Promise.resolve(
        (isBlocked(blockedKey) ? [0, 300, 1] : [1, 9, 0]) as [number, number, number],
      )) as unknown as RateLimitCommands["rateLimitCheck"],
  );
  const pttl = installMock(
    kv(),
    "pttl",
    ((key: string) => Promise.resolve(isBlocked(key) ? 300_000 : -2)) as unknown as Kv["pttl"],
  );
  return {
    restore: () => {
      check.restore();
      pttl.restore();
      valkery.restore();
    },
  };
}

const isGlobalIdentityKey = (key: string) => key.endsWith(":all");
const isCallerIdentityKey = (key: string) => key.includes(":to:") && !key.endsWith(":all");

Deno.test("a saturated global tier does not lock the owner out of their own account", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const restMock = installRestMock({
    internal_t__app_user_devices: await trustedDeviceRows(),
  });
  const limits = throttleWhere(isGlobalIdentityKey);

  try {
    const result = await withRequest(
      fakeDevice({ device_token: DEVICE_TOKEN }),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(
      result instanceof OK,
      "the global tier is keyed on the victim's mailbox: anyone can saturate it, so it must gate failures, not attempts",
    );
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("a saturated global tier still refuses a wrong password", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 400, body: goTrueError("invalid_credentials") }),
  });
  const restMock = installRestMock({});
  const limits = throttleWhere(isGlobalIdentityKey);

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignInError.TooManyRequests);
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});

Deno.test("a saturated caller tier is refused before GoTrue is ever asked", async () => {
  const gotrue = installGoTrueMock({
    "POST /token*": () => ({ status: 200, body: goTrueSession() }),
  });
  const restMock = installRestMock({});
  const limits = throttleWhere(isCallerIdentityKey);

  try {
    const result = await withRequest(
      fakeDevice(),
      () => new EmailSignIn(AccountRole.User).withEmailAndPassword("u1@example.com", PASSWORD),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, EmailSignInError.TooManyRequests);
    assertEquals(
      gotrue.called("POST", "/token*"),
      0,
      "the caller tier is keyed on the abuser's own ip: that one must short-circuit",
    );
  } finally {
    limits.restore();
    restMock.restore();
    gotrue.restore();
  }
});
