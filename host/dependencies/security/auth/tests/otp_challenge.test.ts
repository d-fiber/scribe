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
import type { AuthError, GoTrueSessionResponse } from "@scribe/host/dependencies/security/auth/src/_core/gotrue/transport.ts";
import {
  OtpChallenge,
  ResendError,
  VerifyOtpError,
} from "@scribe/host/dependencies/security/auth/src/sign_in/_otp/otp_challenge.ts";
import type { OtpChannel } from "@scribe/host/dependencies/security/auth/src/sign_in/_otp/otp_channel.ts";
import { PendingToken } from "@scribe/host/dependencies/security/auth/src/_core/pending_token.ts";
import { UserClient } from "@scribe/host/dependencies/security/auth/src/user/user.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK, type Result } from "@scribe/core/contracts/result.ts";
import { SignInProvider } from "@scribe/host/dependencies/security/auth/src/hooks/auth.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueSession, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { assert, assertEquals } from "@std/assert";
import { kv, type Kv } from "@scribe/foundation/src/redis/mod.ts";
import { installMock } from "@scribe/core/testing/install.ts";

class FakeChannel implements OtpChannel {
  readonly provider = SignInProvider.Email;
  sent = 0;
  verified = 0;
  sendResult: Result<void, AuthError> = new OK<void>(undefined);
  verifyResult: Result<GoTrueSessionResponse, AuthError> = new OK(
    goTrueSession() as unknown as GoTrueSessionResponse,
  );

  send(): Promise<Result<void, AuthError>> {
    this.sent++;
    return Promise.resolve(this.sendResult);
  }

  verify(): Promise<Result<GoTrueSessionResponse, AuthError>> {
    this.verified++;
    return Promise.resolve(this.verifyResult);
  }

  resolveRole(): Promise<AccountRole | null> {
    return Promise.resolve(AccountRole.User);
  }
}

function challenge(channel: OtpChannel = new FakeChannel()) {
  return new OtpChallenge(
    new UserClient(),
    new PendingToken(),
    channel,
    AccountRole.User,
  );
}

Deno.test("verifyOtp refuses a non-numeric code without calling the channel", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    const result = await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      return challenge(channel).verifyOtp(started.data.pendingToken, "abc123");
    });

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyOtpError.InvalidOrExpired);
    assertEquals(channel.verified, 0);
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("verifyOtp refuses a code of invalid length", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    const result = await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      return challenge(channel).verifyOtp(started.data.pendingToken, "12345");
    });

    assert(result instanceof Failure);
    assertEquals(channel.verified, 0);
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("the challenge is bound to the device: another device is refused", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    const pending = await withRequest(fakeDevice({ device_id: "device-A" }), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      return started.data.pendingToken;
    });

    const result = await withRequest(
      fakeDevice({ device_id: "device-B" }),
      () => challenge(channel).verifyOtp(pending, "123456"),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyOtpError.InvalidOrExpired);
    assertEquals(channel.verified, 0);
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("resend keeps the original challenge when sending fails", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      const token = started.data.pendingToken;

      channel.sendResult = new Failure({ code: "unexpected_error", message: "boom" });
      const resent = await challenge(channel).resend(token);
      assert(resent instanceof Failure);
      assertEquals(resent.error, ResendError.Unexpected);

      const stillThere = await new PendingToken().exists(token);
      assertEquals(stillThere, true, "the old token must survive a failed send");
    });
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("resend consumes the old token once the new one is issued", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      const first = started.data.pendingToken;

      const resent = await challenge(channel).resend(first);
      assert(resent instanceof OK, `resend failed : ${JSON.stringify(resent)}`);

      assertEquals(await new PendingToken().exists(first), false);
      assertEquals(await new PendingToken().exists(resent.data.pendingToken), true);
    });
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("resend from another device is refused", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    const pending = await withRequest(fakeDevice({ device_id: "device-A" }), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      return started.data.pendingToken;
    });

    const sentBefore = channel.sent;
    const result = await withRequest(
      fakeDevice({ device_id: "device-B" }),
      () => challenge(channel).resend(pending),
    );

    assert(result instanceof Failure);
    assertEquals(result.error, ResendError.InvalidOrExpiredToken);
    assertEquals(channel.sent, sentBefore, "no send must go out");
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("a session without an access_token yields neither a revocation nor a null token", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const gotrue = installGoTrueMock({ "POST /logout*": () => ({ status: 204 }) });
  const channel = new FakeChannel();
  channel.verifyResult = new OK({ user: goTrueSession().user } as unknown as GoTrueSessionResponse);

  try {
    const result = await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      return challenge(channel).verifyOtp(started.data.pendingToken, "123456");
    });

    assert(result instanceof Failure);
    assertEquals(result.error, VerifyOtpError.Unexpected);
    assertEquals(gotrue.called("POST", "/logout"), 0);
  } finally {
    gotrue.restore();
    database.restore();
    env.restore();
  }
});

Deno.test("start refuses a role that is not the challenge's own", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    const result = await withRequest(
      fakeDevice(),
      () => challenge(channel).start("u1@example.com", AccountRole.Admin),
    );
    assert(result instanceof Failure);
    assertEquals(channel.sent, 0);
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("the pending token is stored hashed, never in clear text", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  try {
    await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      const rows = database.rows("internal_t__otp_pending_tokens");
      assertEquals(rows.length, 1);
      assertEquals(rows[0].token_hash, await sha256Hex(started.data.pendingToken));
    });
  } finally {
    database.restore();
    env.restore();
  }
});

Deno.test("verifyOtp keeps the pending token alive when the counter is down", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  const incr = installMock(
    kv(),
    "incr",
    (() => Promise.reject(new Error("redis down"))) as unknown as Kv["incr"],
  );

  try {
    const result = await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      const outcome = await challenge(channel).verifyOtp(started.data.pendingToken, "123456");
      return { outcome, pendingToken: started.data.pendingToken };
    });

    assert(result.outcome instanceof Failure);
    assertEquals(
      result.outcome.error,
      VerifyOtpError.TooManyRequests,
      "an unusable counter is a retry signal, not a bad code",
    );
    assertEquals(channel.verified, 0, "the channel must not be reached");
    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      1,
      "our own outage must not burn the user's challenge",
    );
  } finally {
    incr.restore();
    database.restore();
    env.restore();
  }
});

Deno.test("resend keeps the pending token alive when the counter is down", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  const incr = installMock(
    kv(),
    "incr",
    (() => Promise.reject(new Error("redis down"))) as unknown as Kv["incr"],
  );

  try {
    const result = await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      return challenge(channel).resend(started.data.pendingToken);
    });

    assert(result instanceof Failure);
    assertEquals(result.error, ResendError.TooManyRequests);
    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      1,
      "our own outage must not burn the user's challenge",
    );
  } finally {
    incr.restore();
    database.restore();
    env.restore();
  }
});

Deno.test("verifyOtp still burns the token once the real budget is spent", async () => {
  const env = installAuthEnv();
  const database = installDatabaseMock({});
  const channel = new FakeChannel();
  const incr = installMock(
    kv(),
    "incr",
    (() => Promise.resolve(99)) as unknown as Kv["incr"],
  );

  try {
    await withRequest(fakeDevice(), async () => {
      const started = await challenge(channel).start("u1@example.com", AccountRole.User);
      assert(started instanceof OK);
      const outcome = await challenge(channel).verifyOtp(started.data.pendingToken, "123456");
      assert(outcome instanceof Failure);
      assertEquals(outcome.error, VerifyOtpError.InvalidOrExpired);
    });

    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      0,
      "an exhausted attacker budget still destroys the challenge",
    );
  } finally {
    incr.restore();
    database.restore();
    env.restore();
  }
});
