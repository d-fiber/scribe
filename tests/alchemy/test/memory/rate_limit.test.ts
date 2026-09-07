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

import "@scribe/scholium/runner.ts";
import {
  equals,
  expect,
  FixedNow,
  isFalse,
  isTrue,
  MemoryRateLimiter,
  MemoryRateLimiters,
  same,
  Scribe,
} from "@scribe/alchemy/test";
import { Duration, Now } from "@scribe/alchemy";

Scribe.test("a call within the limit is allowed, and remaining counts down", async () => {
  Now.use(new FixedNow(0));
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 3,
    window: Duration.minutes(1),
    penalty: Duration.seconds(30),
  });

  const first = await limiter.check();
  const second = await limiter.check();

  expect(first, equals({ ok: true, remaining: 2 }));
  expect(second, equals({ ok: true, remaining: 1 }));
});

Scribe.test("a call past the limit is refused, and going over again doubles the penalty", async () => {
  const now = new FixedNow(0);
  Now.use(now);
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 1,
    window: Duration.minutes(1),
    penalty: Duration.seconds(10),
  });

  await limiter.check();
  const firstOver = await limiter.check();
  expect(firstOver, equals({ ok: false, retryAfter: 10, strikes: 1 }));

  now.pass(Duration.seconds(20));
  const secondOver = await limiter.check();
  expect(secondOver, equals({ ok: false, retryAfter: 20, strikes: 2 }));
});

Scribe.test("the penalty stops doubling once it reaches maxPenalty", async () => {
  const now = new FixedNow(0);
  Now.use(now);
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 1,
    window: Duration.minutes(1),
    penalty: Duration.seconds(10),
    maxPenalty: Duration.seconds(15),
  });

  await limiter.check();
  const firstOver = await limiter.check();
  expect(firstOver, equals({ ok: false, retryAfter: 10, strikes: 1 }));

  now.pass(Duration.seconds(15));
  const secondOver = await limiter.check();
  expect(secondOver, equals({ ok: false, retryAfter: 15, strikes: 2 }));
});

Scribe.test("the count starts again once the window has turned", async () => {
  const now = new FixedNow(0);
  Now.use(now);
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 1,
    window: Duration.minutes(1),
    penalty: Duration.seconds(10),
  });

  await limiter.check();
  now.pass(Duration.minutes(1));

  const afterWindow = await limiter.check();
  expect(afterWindow, equals({ ok: true, remaining: 0 }));
});

Scribe.test("isBlocked reads the held-out state without counting a call", async () => {
  const now = new FixedNow(0);
  Now.use(now);
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 1,
    window: Duration.minutes(1),
    penalty: Duration.seconds(10),
  });

  await limiter.check();
  await limiter.check();

  for (let i = 0; i < 5; i++) {
    expect(await limiter.isBlocked(), isTrue, "a caller already held out was not reported as blocked");
  }

  now.pass(Duration.seconds(10));
  for (let i = 0; i < 5; i++) {
    expect(await limiter.isBlocked(), isFalse, "a caller whose penalty passed was still reported as blocked");
  }

  const nextOutcome = await limiter.check();
  expect(
    nextOutcome,
    equals({ ok: false, retryAfter: 20, strikes: 2 }),
    "isBlocked left a mark on the counter, so the next real call did not see the state check() alone would have produced",
  );
});

Scribe.test("unmeasured always answers the full quota, without touching the real count", async () => {
  Now.use(new FixedNow(0));
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 5,
    window: Duration.minutes(1),
    penalty: Duration.seconds(10),
  });

  await limiter.check();

  expect(limiter.unmeasured(), equals({ ok: true, remaining: 5 }));
  expect(await limiter.check(), equals({ ok: true, remaining: 3 }), "unmeasured left a mark on the real count");
});

Scribe.test("key answers the prefix this limit was opened with", () => {
  const limiter = new MemoryRateLimiter({
    key: "signup",
    limit: 5,
    window: Duration.minutes(1),
    penalty: Duration.seconds(10),
  });

  expect(limiter.key, equals("signup"));
});

Scribe.test("opening the same key twice answers the same limiter", () => {
  const driver = new MemoryRateLimiters();

  const first = driver.open({ key: "signup", limit: 5, window: Duration.minutes(1), penalty: Duration.seconds(10) });
  const second = driver.open({ key: "signup", limit: 5, window: Duration.minutes(1), penalty: Duration.seconds(10) });

  expect(first, same(second));
});
