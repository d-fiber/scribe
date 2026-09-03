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

import type { Future } from "../../async/future.ts";
import type { CacheDriver } from "../../port/cache.ts";
import { Duration } from "../../value/duration.ts";
import { Now } from "../../value/date_time.ts";
import { FixedNow } from "../memory/now.ts";
import { AssertionError } from "../expect/error.ts";

/**
 * Runs every promise the cache port makes against `driver`, and refuses the first one it breaks.
 *
 * @remarks
 * A port is an interface plus a set of promises no signature can express: that opening one key
 * twice answers one store, that an entry stops being readable once its lifetime has run out, that a
 * computation handed to `upsert` runs once however many callers ask at the same time. A driver that
 * compiles has said nothing about any of them.
 *
 * This is what a host runs against the driver it wrote, inside one case of its own suite, so that
 * the promises a package was written against are checked where they are actually kept. Without it
 * every package writes its own double, the doubles disagree, and the suites are all green while
 * production is not.
 *
 * It moves the clock rather than waiting on one, so it takes no measurable time. `Now` is filled
 * for the length of the run and put back afterwards.
 *
 * @param driver - What to check. It is opened several times, and left holding whatever it held.
 *
 * @throws {AssertionError} On the first promise `driver` does not keep, saying which one.
 *
 * @example
 * ```ts ignore
 * Deno.test("the Redis cache keeps what the port promises", async () => {
 *   await checkCacheDriver(new RedisCaches(url));
 * });
 * ```
 */
export async function checkCacheDriver(driver: CacheDriver): Future<void> {
  const clock = new FixedNow(1_700_000_000_000);
  const before = Now.configured ? Now.get() : null;
  Now.use(clock);

  try {
    await holdsWhatItWasGiven(driver);
    await answersNothingForWhatItWasNotGiven(driver);
    await forgetsAnEntryOnceItsLifetimeHasRun(driver);
    await answersOneStorePerKey(driver);
    await runsOneComputationHoweverManyAsk(driver);
    await forgetsWhatItIsToldTo(driver);
    await takesTheDefaultWhenAnOptionIsLeftOut(driver, clock);
    await neverPassesAWriteOffAsDoneWhenItIsNot(driver);
    await carriesEveryOptionItWasOpenedWith(driver);
  } finally {
    if (before !== null) Now.use(before);
  }
}

/** Refuses `held` unless it is `expected`, saying which promise was broken. */
function must(held: unknown, expected: unknown, promise: string): void {
  if (JSON.stringify(held) === JSON.stringify(expected)) return;
  throw new AssertionError(
    `A cache driver did not keep a promise of the port.\n\n  promise   ${promise}\n  expected  ${
      JSON.stringify(expected)
    }\n  actual    ${JSON.stringify(held)}`,
  );
}

async function holdsWhatItWasGiven(driver: CacheDriver): Future<void> {
  const held = driver.open<string>({ key: "conformity:held" });

  await held.add("ada", "one");
  must(await held.get("ada"), "one", "what was added is what comes back");

  await held.addMany([["grace", "two"], ["alan", "three"]]);
  must(await held.getMany(["grace", "alan"]), ["two", "three"], "a batch comes back in the order it was asked for");
}

async function answersNothingForWhatItWasNotGiven(driver: CacheDriver): Future<void> {
  const held = driver.open<string>({ key: "conformity:absent" });

  must(await held.get("nobody"), null, "an identifier nothing was held under answers null");
  must(await held.getMany(["nobody", "nor anybody"]), [null, null], "a batch answers null where nothing is held");
}

async function forgetsAnEntryOnceItsLifetimeHasRun(driver: CacheDriver): Future<void> {
  const held = driver.open<string>({ key: "conformity:ttl", ttl: Duration.minutes(5) });

  await held.add("ada", "one");
  (Now.get() as FixedNow).pass(Duration.minutes(4));
  must(await held.get("ada"), "one", "an entry inside its lifetime is still there");

  (Now.get() as FixedNow).pass(Duration.minutes(2));
  must(await held.get("ada"), null, "an entry past its lifetime is gone");
}

async function answersOneStorePerKey(driver: CacheDriver): Future<void> {
  const first = driver.open<string>({ key: "conformity:shared" });
  const second = driver.open<string>({ key: "conformity:shared" });

  await first.add("ada", "one");
  must(await second.get("ada"), "one", "opening one key twice answers one store");
}

async function runsOneComputationHoweverManyAsk(driver: CacheDriver): Future<void> {
  const held = driver.open<string>({ key: "conformity:once" });
  let ran = 0;

  const compute = () => {
    ran++;
    return new Promise<string>((settle) => setTimeout(() => settle("one"), 1));
  };

  const asked = await Promise.all(Array.from({ length: 10 }, () => held.upsert("ada", compute)));

  must(ran, 1, "a computation handed to upsert runs once however many callers ask at the same time");
  must(asked, Array.from({ length: 10 }, () => "one"), "every caller of upsert is answered the one value");
}

async function forgetsWhatItIsToldTo(driver: CacheDriver): Future<void> {
  const held = driver.open<string>({ key: "conformity:clear" });

  await held.add("ada", "one");
  await held.delete("ada");
  must(await held.get("ada"), null, "what was deleted is gone");

  await held.addMany([["a", "1"], ["b", "2"]]);
  await held.deleteMany("a", "b");
  must(await held.getMany(["a", "b"]), [null, null], "what was deleted as a batch is gone");

  await held.add("kept", "one");
  await held.clear();
  must(await held.get("kept"), null, "clearing forgets everything");
}

/**
 * Refuses a driver that reads an absent option as nothing rather than as the documented default.
 *
 * An option left out is not an option set to zero. A driver that forgets a ttl and stores
 * forever, or one that treats it as expired at once, both compile and both pass every promise
 * about a ttl that was given, which is why the case has to be about the one that was not.
 */
async function takesTheDefaultWhenAnOptionIsLeftOut(
  driver: CacheDriver,
  clock: FixedNow,
): Future<void> {
  const held = driver.open<string>({ key: "conformity:default" });

  await held.add("ada", "one");
  clock.pass(Duration.minutes(1));
  must(await held.get("ada"), "one", "an entry whose declaration named no ttl is still there a minute later");
}

/**
 * Refuses a driver that answers a write as done when the entry cannot be read back.
 *
 * It is the promise a store breaks most quietly: a write that returned without raising and a
 * write that happened are two different facts, and a caller has no way to tell them apart
 * afterwards except by reading.
 */
async function neverPassesAWriteOffAsDoneWhenItIsNot(driver: CacheDriver): Future<void> {
  const held = driver.open<string>({ key: "conformity:written" });

  await held.add("ada", "one");
  must(await held.get("ada"), "one", "an add that returned is an add that happened");

  await held.addMany([["a", "1"], ["b", "2"]]);
  must(await held.getMany(["a", "b"]), ["1", "2"], "an addMany that returned is an addMany that happened");

  const computed = await held.upsert("grace", () => Promise.resolve("two"));
  must(computed, "two", "upsert answers what it computed");
  must(await held.get("grace"), "two", "and what it computed is what it stored");
}

/**
 * Refuses a driver that drops an option the port declares.
 *
 * A driver reads the options one field at a time, and nothing makes it read them all: a field
 * the port gains, or one a driver never got round to, is dropped in silence and every promise
 * about the fields it did read still holds. So the case opens one store per field the port
 * declares and asks the driver to behave differently for each.
 */
async function carriesEveryOptionItWasOpenedWith(driver: CacheDriver): Future<void> {
  const named = driver.open<string>({ key: "conformity:carried", ttl: Duration.hours(1) });
  const other = driver.open<string>({ key: "conformity:carried:other", ttl: Duration.hours(1) });

  await named.add("ada", "one");
  must(await other.get("ada"), null, "two keys are two namespaces, whatever they were opened with");

  const again = driver.open<string>({ key: "conformity:carried", ttl: Duration.hours(1) });
  must(await again.get("ada"), "one", "opening a key twice reaches what the first one wrote");
}
