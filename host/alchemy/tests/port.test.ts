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

import { assertEquals, assertFalse } from "@std/assert";
import type { Cache, CacheDriver, CacheOptions, RateLimiter, RateLimiterDriver, RateLimitOutcome } from "../mod.ts";
import { cache, Caches, rateLimit, RateLimiters, Slot, Time } from "../mod.ts";

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

/** What a package would write: it names a port, never an implementation. */
function roleOf(members: Cache<string>, who: string): Promise<string> {
  return members.upsert(who, () => Promise.resolve("reader"));
}

Deno.test("a package reaches a cache without naming what is behind it", async () => {
  const driver = new OpensInMemory();
  Caches.use(driver);

  const members = Caches.get().open<string>({ key: "audience:member", ttl: Time.days(7) });

  assertEquals(await roleOf(members, "ada"), "reader", "the computed value was not handed back");
  assertEquals(await members.get("ada"), "reader", "what was computed was not kept");
  assertEquals(driver.opened[0].key, "audience:member", "the cache was opened under another name");
});

Deno.test("what is already held is handed back instead of being computed again", async () => {
  Caches.use(new OpensInMemory());
  const members = Caches.get().open<string>({ key: "audience:member" });
  await members.add("ada", "editor");

  let computed = 0;
  const held = await members.upsert("ada", () => {
    computed++;
    return Promise.resolve("reader");
  });

  assertEquals(held, "editor", "what was held was replaced by a fresh computation");
  assertEquals(computed, 0, "the computation ran although something was held");
});

Deno.test("a refusal carries what the caller needs to try again", async () => {
  RateLimiters.use({ open: () => new RefusesEverybody() } as RateLimiterDriver);

  const outcome = await RateLimiters.get().open({
    key: "sign_in",
    limit: 5,
    window: Time.minutes(1),
    penalty: Time.minutes(10),
  }).check("", "ada");

  assertFalse(outcome.ok, "a limiter that refuses everybody let somebody through");
  if (!outcome.ok) {
    assertEquals(outcome.retryAfter, 30, "the refusal did not say when to try again");
    assertEquals(outcome.strikes, 2, "the refusal did not count the strikes");
  }
});

Deno.test("declaring a cache at module scope touches nothing, so an import before boot is safe", () => {
  const untouched = new Slot<CacheDriver>("Untouched");
  const declared = cache<string>({ key: "audience:member" });

  assertFalse(untouched.configured, "the fixture slot was filled by something");
  assertEquals(typeof declared.get, "function", "declaring a cache did not hand back a cache");
});

Deno.test("a cache opens itself at the first call, not at the declaration", async () => {
  const driver = new OpensInMemory();
  const members = cache<string>({ key: "audience:member" });

  Caches.use(driver);
  assertEquals(driver.opened.length, 0, "the cache was opened before anything used it");

  await members.add("ada", "editor");
  assertEquals(driver.opened.length, 1, "the cache was not opened by the first call");

  await members.get("ada");
  assertEquals(driver.opened.length, 1, "the cache was opened again by a second call");
});

Deno.test("a rate limit declared at module scope opens at the first call too", async () => {
  let opened = 0;
  const limit = rateLimit({ key: "sign_in", limit: 5, window: Time.minutes(1), penalty: Time.minutes(10) });

  RateLimiters.use({
    open: () => {
      opened++;
      return new RefusesEverybody();
    },
  });

  assertEquals(opened, 0, "the limit was opened before anything used it");
  await limit.check();
  assertEquals(opened, 1, "the limit was not opened by the first call");
});
