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

import { Time } from "@scribe/core/contracts/common/time.ts";
import type { RateLimitCommands } from "@scribe/core/runtime/redis/rate_limiter/script.ts";
import { kv } from "@scribe/core/runtime/redis/mod.ts";
import { rateLimiter, RateLimitScope } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { assertEquals } from "@std/assert";

function captureKeys() {
  const keys: string[] = [];
  const mock = installMock(
    kv() as unknown as RateLimitCommands,
    "rateLimitCheck",
    ((blockedKey: string) => {
      keys.push(blockedKey);
      return Promise.resolve([1, 9, 0] as [number, number, number]);
    }) as unknown as RateLimitCommands["rateLimitCheck"],
  );
  return { keys, restore: () => mock.restore() };
}

const OPTIONS = {
  limit: 1,
  window: Time.seconds(90),
  penalty: Time.seconds(90),
};

function requestFrom(ip: string): Request {
  return new Request("http://api.test/reset", { headers: { "x-real-ip": ip } });
}

Deno.test("Caller scope: the key is suffixed with the caller", async () => {
  const { keys, restore } = captureKeys();
  try {
    await RequestScope.run(
      requestFrom("1.2.3.4"),
      new Uint8Array(0),
      () => rateLimiter.check({ key: "reset-password:email:to:abc", ...OPTIONS }),
      "127.0.0.1",
    );
    await RequestScope.run(
      requestFrom("5.6.7.8"),
      new Uint8Array(0),
      () => rateLimiter.check({ key: "reset-password:email:to:abc", ...OPTIONS }),
      "127.0.0.1",
    );
  } finally {
    restore();
  }

  assertEquals(keys, [
    "rl:blocked:reset-password:email:to:abc:1.2.3.4",
    "rl:blocked:reset-password:email:to:abc:5.6.7.8",
  ]);
});

Deno.test("Global scope: two different IPs share the same counter", async () => {
  const { keys, restore } = captureKeys();
  try {
    await RequestScope.run(requestFrom("1.2.3.4"), new Uint8Array(0), () =>
      rateLimiter.check({
        key: "reset-password:email:to:abc",
        ...OPTIONS,
        scope: RateLimitScope.Global,
      }), "127.0.0.1");
    await RequestScope.run(requestFrom("5.6.7.8"), new Uint8Array(0), () =>
      rateLimiter.check({
        key: "reset-password:email:to:abc",
        ...OPTIONS,
        scope: RateLimitScope.Global,
      }), "127.0.0.1");
  } finally {
    restore();
  }

  assertEquals(keys, [
    "rl:blocked:reset-password:email:to:abc",
    "rl:blocked:reset-password:email:to:abc",
  ]);
});

Deno.test("Global scope: usable outside a request scope", async () => {
  const { keys, restore } = captureKeys();
  try {
    const result = await rateLimiter.check({
      key: "reset-password:email:to:abc",
      ...OPTIONS,
      scope: RateLimitScope.Global,
    });
    assertEquals(result.ok, true);
  } finally {
    restore();
  }
  assertEquals(keys, ["rl:blocked:reset-password:email:to:abc"]);
});

Deno.test("Caller scope: an unattributable caller never joins a shared bucket", async () => {
  const { keys, restore } = captureKeys();
  try {
    await RequestScope.run(
      new Request("http://api.test/reset"),
      new Uint8Array(0),
      () => rateLimiter.check({ key: "sign-in:admin:email", ...OPTIONS }),
      "203.0.113.9",
    );
  } finally {
    restore();
  }

  assertEquals(
    keys,
    [],
    "an untrusted peer yields no ip: keying on the empty string would merge every anonymous caller into one counter",
  );
});

Deno.test("Caller scope: an unattributable caller is refused when failOpen is off", async () => {
  const { restore } = captureKeys();
  try {
    const result = await RequestScope.run(
      new Request("http://api.test/reset"),
      new Uint8Array(0),
      () =>
        rateLimiter.check({
          key: "sign-in:admin:email",
          ...OPTIONS,
          failOpen: false,
        }),
      "203.0.113.9",
    );

    assertEquals(result.ok, false);
  } finally {
    restore();
  }
});

Deno.test("Caller scope: an unattributable caller passes when failOpen is on", async () => {
  const { restore } = captureKeys();
  try {
    const result = await RequestScope.run(
      new Request("http://api.test/reset"),
      new Uint8Array(0),
      () => rateLimiter.check({ key: "discover:feed", ...OPTIONS }),
      "203.0.113.9",
    );

    assertEquals(result.ok, true);
  } finally {
    restore();
  }
});

function capturePenalties() {
  const penalties: { maxPenalty: number; strikeMemory: number }[] = [];
  const mock = installMock(
    kv() as unknown as RateLimitCommands,
    "rateLimitCheck",
    ((
      _blocked: string,
      _window: string,
      _strikes: string,
      _limit: number,
      _windowSeconds: number,
      _penalty: number,
      maxPenalty: number,
      strikeMemory: number,
    ) => {
      penalties.push({ maxPenalty, strikeMemory });
      return Promise.resolve([1, 9, 0] as [number, number, number]);
    }) as unknown as RateLimitCommands["rateLimitCheck"],
  );
  return { penalties, restore: () => mock.restore() };
}

const LONG_PENALTY = {
  limit: 5,
  window: Time.minutes(30),
  penalty: Time.hours(1),
  maxPenalty: Time.hours(24),
  strikeMemory: Time.hours(24),
};

Deno.test("a shared address never carries a day-long penalty", async () => {
  const { penalties, restore } = capturePenalties();
  try {
    await RequestScope.run(
      requestFrom("100.64.12.9"),
      new Uint8Array(0),
      () => rateLimiter.check({ key: "sign-up:user", ...LONG_PENALTY }),
      "127.0.0.1",
    );
  } finally {
    restore();
  }

  assertEquals(
    penalties[0].maxPenalty,
    Time.minutes(15).value,
    "one noisy install behind a carrier NAT must not lock out the carrier",
  );
  assertEquals(penalties[0].strikeMemory, Time.hours(1).value);
});

Deno.test("an identified caller keeps the full declared penalty", async () => {
  const { penalties, restore } = capturePenalties();
  try {
    await RequestScope.run(
      requestFrom("100.64.12.9"),
      new Uint8Array(0),
      () => {
        RequestScope.cache.set("identity:user:resolved", {
          id: "user-1",
          email: null,
        });
        return rateLimiter.check({ key: "sign-up:user", ...LONG_PENALTY });
      },
      "127.0.0.1",
    );
  } finally {
    restore();
  }

  assertEquals(penalties[0].maxPenalty, Time.hours(24).value);
  assertEquals(penalties[0].strikeMemory, Time.hours(24).value);
});

Deno.test("a global bucket is never softened, it belongs to nobody", async () => {
  const { penalties, restore } = capturePenalties();
  try {
    await RequestScope.run(
      requestFrom("100.64.12.9"),
      new Uint8Array(0),
      () =>
        rateLimiter.check({
          key: "sign-up:user:to:hash",
          ...LONG_PENALTY,
          scope: RateLimitScope.Global,
        }),
      "127.0.0.1",
    );
  } finally {
    restore();
  }

  assertEquals(penalties[0].maxPenalty, Time.hours(24).value);
});
