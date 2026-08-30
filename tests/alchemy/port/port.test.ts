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

import "@scribe/runtime/scholium/runner.ts";
import { equals, expect, expectLater, isA, isFalse, Scribe, throwsA } from "@scribe/alchemy/test";
import type {
  Cache,
  CacheDriver,
  CacheOptions,
  RateLimiter,
  RateLimiterDriver,
  RateLimitOutcome,
} from "@scribe/alchemy";
import { cache, Caches, Duration, rateLimit, RateLimiters, Slot, TimeoutException } from "@scribe/alchemy";

class HeldInMemory<T> implements Cache<T> {
  readonly #held = new Map<string, T>();

  get(id: string): Promise<T | null> {
    return Promise.resolve(this.#held.get(id) ?? null);
  }

  getMany(ids: readonly string[]): Promise<(T | null)[]> {
    return Promise.resolve(ids.map((id) => this.#held.get(id) ?? null));
  }

  add(id: string, value: T): Promise<void> {
    this.#held.set(id, value);
    return Promise.resolve();
  }

  addMany(entries: readonly [string, T][]): Promise<void> {
    for (const [id, value] of entries) this.#held.set(id, value);
    return Promise.resolve();
  }

  delete(id: string): Promise<void> {
    this.#held.delete(id);
    return Promise.resolve();
  }

  deleteMany(...ids: string[]): Promise<void> {
    for (const id of ids) this.#held.delete(id);
    return Promise.resolve();
  }

  async upsert(id: string, compute: () => Promise<T>): Promise<T> {
    const held = this.#held.get(id);
    if (held !== undefined) return held;

    const computed = await compute();
    this.#held.set(id, computed);
    return computed;
  }

  clear(): Promise<void> {
    this.#held.clear();
    return Promise.resolve();
  }
}

class OpensInMemory implements CacheDriver {
  readonly opened: CacheOptions[] = [];

  open<T>(options: CacheOptions): Cache<T> {
    this.opened.push(options);
    return new HeldInMemory<T>();
  }
}

class RefusesEverybody implements RateLimiter {
  readonly key = "refuses-everybody";

  check(): Promise<RateLimitOutcome> {
    return Promise.resolve({ ok: false, retryAfter: 30, strikes: 2 });
  }

  isBlocked(): Promise<boolean> {
    return Promise.resolve(true);
  }

  unmeasured(): RateLimitOutcome {
    return { ok: true, remaining: 0 };
  }
}

function roleOf(members: Cache<string>, who: string): Promise<string> {
  return members.upsert(who, () => Promise.resolve("reader"));
}

Scribe.test("a package reaches a cache without naming what is behind it", async () => {
  const driver = new OpensInMemory();
  Caches.use(driver);

  const members = Caches.get().open<string>({ key: "audience:member", ttl: Duration.days(7) });

  expect(await roleOf(members, "ada"), equals("reader"), "the computed value was not handed back");
  expect(await members.get("ada"), equals("reader"), "what was computed was not kept");
  expect(driver.opened[0].key, equals("audience:member"), "the cache was opened under another name");
});

Scribe.test("what is already held is handed back instead of being computed again", async () => {
  Caches.use(new OpensInMemory());
  const members = Caches.get().open<string>({ key: "audience:member" });
  await members.add("ada", "editor");

  let computed = 0;
  const held = await members.upsert("ada", () => {
    computed++;
    return Promise.resolve("reader");
  });

  expect(held, equals("editor"), "what was held was replaced by a fresh computation");
  expect(computed, equals(0), "the computation ran although something was held");
});

Scribe.test("a refusal carries what the caller needs to try again", async () => {
  RateLimiters.use({ open: () => new RefusesEverybody() } as RateLimiterDriver);

  const outcome = await RateLimiters.get().open({
    key: "sign_in",
    limit: 5,
    window: Duration.minutes(1),
    penalty: Duration.minutes(10),
  }).check("", "ada");

  expect(outcome.ok, isFalse, "a limiter that refuses everybody let somebody through");
  if (!outcome.ok) {
    expect(outcome.retryAfter, equals(30), "the refusal did not say when to try again");
    expect(outcome.strikes, equals(2), "the refusal did not count the strikes");
  }
});

Scribe.test("declaring a cache at module scope touches nothing, so an import before boot is safe", () => {
  const untouched = new Slot<CacheDriver>("Untouched");
  const declared = cache<string>({ key: "audience:member" });

  expect(untouched.configured, isFalse, "the fixture slot was filled by something");
  expect(typeof declared.get, equals("function"), "declaring a cache did not hand back a cache");
});

Scribe.test("a cache opens itself at the first call, not at the declaration", async () => {
  const driver = new OpensInMemory();
  const members = cache<string>({ key: "audience:member" });

  Caches.use(driver);
  expect(driver.opened.length, equals(0), "the cache was opened before anything used it");

  await members.add("ada", "editor");
  expect(driver.opened.length, equals(1), "the cache was not opened by the first call");

  await members.get("ada");
  expect(driver.opened.length, equals(1), "the cache was opened again by a second call");
});

Scribe.test("a rate limit declared at module scope opens at the first call too", async () => {
  let opened = 0;
  const limit = rateLimit({ key: "sign_in", limit: 5, window: Duration.minutes(1), penalty: Duration.minutes(10) });

  RateLimiters.use({
    open: () => {
      opened++;
      return new RefusesEverybody();
    },
  });

  expect(opened, equals(0), "the limit was opened before anything used it");
  await limit.check();
  expect(opened, equals(1), "the limit was not opened by the first call");
});

Scribe.test("a cache that answers too slowly is read as a cache that holds nothing", async () => {
  Caches.use({
    open<T>(): Cache<T> {
      return {
        get: () => new Promise(() => {}),
        getMany: () => new Promise(() => {}),
        add: () => Promise.resolve(),
        addMany: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        deleteMany: () => Promise.resolve(),
        upsert: () => new Promise(() => {}),
        clear: () => Promise.resolve(),
      } as Cache<T>;
    },
  });

  const held = cache<string>({ key: "slow", deadline: Duration.milliseconds(5) });

  expect(await held.get("ada"), equals(null), "a slow cache held a request instead of missing");
});

Scribe.test("a cache that answers too slowly raises when the declaration asked it to", async () => {
  Caches.use({
    open<T>(): Cache<T> {
      return {
        get: () => new Promise(() => {}),
        getMany: () => new Promise(() => {}),
        add: () => Promise.resolve(),
        addMany: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        deleteMany: () => Promise.resolve(),
        upsert: () => new Promise(() => {}),
        clear: () => Promise.resolve(),
      } as Cache<T>;
    },
  });

  const held = cache<string>({ key: "slow", deadline: Duration.milliseconds(5), onTimeout: "throw" });

  await expectLater(() => held.get("ada"), throwsA(isA(TimeoutException)));
});

Scribe.test("a write that runs out of time raises whatever the declaration said about reads", async () => {
  Caches.use({
    open<T>(): Cache<T> {
      return {
        get: () => Promise.resolve(null),
        getMany: () => Promise.resolve([]),
        add: () => new Promise(() => {}),
        addMany: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        deleteMany: () => Promise.resolve(),
        upsert: () => new Promise(() => {}),
        clear: () => Promise.resolve(),
      } as Cache<T>;
    },
  });

  const held = cache<string>({ key: "slow", deadline: Duration.milliseconds(5), onTimeout: "miss" });

  await expectLater(() => held.add("ada", "one"), throwsA(isA(TimeoutException)));
});
