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

// Needs `REDIS_URL` in the environment (see `tests/.env.test`) `kv.ts` reads it at
// module load time, but the `ioredis` client itself is `lazyConnect: true`, so no real
// connection is attempted and `--allow-net` isn't required (see `.claude/testing.md`).

import { Time } from "@scribe/core/contracts/common/time.ts";
import { rateLimiter, RateLimitError } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";
import { assertEquals } from "@std/assert";
import { installRateLimiterMock, installValkeryMock } from "@scribe/foundation/testing/valkery.ts";

Deno.test(
  "installValkeryMock: a Valkery subclass reads/writes against an in-memory store, restore() puts Redis back",
  async () => {
    const mock = installValkeryMock();
    const cache = new Valkery<unknown>({ key: "test", ttl: Time.seconds(60) });

    assertEquals(await cache.get("missing"), null);
    await cache.add("1", "a");
    assertEquals(await cache.get("1"), "a");

    mock.restore();
  },
);

Deno.test(
  "installValkeryMock: upsert only calls fn once for a cached key",
  async () => {
    const mock = installValkeryMock();
    const cache = new Valkery<unknown>({ key: "test", ttl: Time.seconds(60) });
    let calls = 0;
    const fn = () => {
      calls++;
      return Promise.resolve("value");
    };

    assertEquals(await cache.upsert("key", fn), "value");
    assertEquals(await cache.upsert("key", fn), "value");
    assertEquals(calls, 1);

    mock.restore();
  },
);

Deno.test(
  "installValkeryMock: clear with a prefix only clears matching keys",
  async () => {
    const mock = installValkeryMock();
    const cache = new Valkery<unknown>({ key: "test", ttl: Time.seconds(60) });
    await cache.add("brand:1", "a");
    await cache.add("brand:2", "b");
    await cache.add("store:1", "c");

    await cache.clear("brand:*");

    assertEquals(await cache.get("brand:1"), null);
    assertEquals(await cache.get("brand:2"), null);
    assertEquals(await cache.get("store:1"), "c");

    mock.restore();
  },
);

Deno.test(
  "installRateLimiterMock: defaults to an ok result and restore() puts the real check back",
  async () => {
    const original = rateLimiter.check;
    const mock = installRateLimiterMock();

    const result = await rateLimiter.check({
      key: "x",
      limit: 10,
      window: Time.seconds(60),
      penalty: Time.seconds(60),
    });
    assertEquals(result, { ok: true, remaining: 999 });

    mock.restore();
    assertEquals(rateLimiter.check, original);
  },
);

Deno.test("installRateLimiterMock: accepts a custom result", async () => {
  const mock = installRateLimiterMock({
    ok: false,
    error: RateLimitError.Limited,
    retryAfter: 30,
    strikes: 1,
  });

  const result = await rateLimiter.check({
    key: "x",
    limit: 10,
    window: Time.seconds(60),
    penalty: Time.seconds(60),
  });

  assertEquals(result, {
    ok: false,
    error: RateLimitError.Limited,
    retryAfter: 30,
    strikes: 1,
  });
  mock.restore();
});
