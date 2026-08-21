// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

// Needs `REDIS_URL` in the environment (see `tests/.env.test`) `kv.ts` reads it at
// module load time, but the `ioredis` client itself is `lazyConnect: true`, so no real
// connection is attempted and `--allow-net` isn't required (see `.claude/testing.md`).

import { Time } from "@scribe/core/contracts/common/time.ts";
import { RateLimit } from "@scribe/foundation/src/rate_limit/mod.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";
import { assertEquals } from "@std/assert";
import { installRateLimiterMock, installValkeryMock } from "@scribe/foundation/testing/valkery.ts";

const LIMIT = new RateLimit({
  key: "x",
  limit: 10,
  window: Time.seconds(60),
  penalty: Time.seconds(60),
});

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
    const original = RateLimit.prototype.check;
    const mock = installRateLimiterMock();

    const result = await LIMIT.check();
    assertEquals(result, { ok: true, remaining: 999 });

    mock.restore();
    assertEquals(RateLimit.prototype.check, original);
  },
);

Deno.test("installRateLimiterMock: accepts a custom result", async () => {
  const mock = installRateLimiterMock({ ok: false, retryAfter: 30, strikes: 1 });

  const result = await LIMIT.check();

  assertEquals(result, { ok: false, retryAfter: 30, strikes: 1 });
  mock.restore();
});
