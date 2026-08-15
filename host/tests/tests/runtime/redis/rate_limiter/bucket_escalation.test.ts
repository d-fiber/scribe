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
import { RateLimitBucket } from "@scribe/core/runtime/redis/rate_limiter/bucket.ts";
import { CallerKind } from "@scribe/core/runtime/redis/rate_limiter/caller.ts";
import { RateLimitError } from "@scribe/core/runtime/redis/rate_limiter/contract.ts";
import {
  atMost,
  escalationFor,
  SHARED_ADDRESS_MAX_PENALTY,
  SHARED_ADDRESS_STRIKE_MEMORY,
} from "@scribe/core/runtime/redis/rate_limiter/escalation.ts";
import {
  allow,
  block,
  fallback,
} from "@scribe/core/runtime/redis/rate_limiter/outcome.ts";
import { assertEquals, assertNotEquals } from "@std/assert";

const DECLARED = {
  maxPenalty: Time.hours(24),
  strikeMemory: Time.hours(24),
};

Deno.test("RateLimitBucket derives its three keys from one caller key", () => {
  const bucket = new RateLimitBucket("sign-in:admin:1.2.3.4");

  assertEquals(bucket.blockedKey, "rl:blocked:sign-in:admin:1.2.3.4");
  assertEquals(bucket.windowKey, "rl:window:sign-in:admin:1.2.3.4");
  assertEquals(bucket.strikesKey, "rl:strikes:sign-in:admin:1.2.3.4");
});

Deno.test("RateLimitBucket never lets two callers share a key", () => {
  const first = new RateLimitBucket("sign-in:1.2.3.4");
  const second = new RateLimitBucket("sign-in:5.6.7.8");

  assertNotEquals(first.blockedKey, second.blockedKey);
  assertNotEquals(first.windowKey, second.windowKey);
});

Deno.test("atMost caps a duration without lengthening a shorter one", () => {
  assertEquals(atMost(Time.hours(24), Time.minutes(15)), Time.minutes(15));
  assertEquals(atMost(Time.minutes(5), Time.minutes(15)), Time.minutes(5));
  assertEquals(atMost(Time.minutes(15), Time.minutes(15)), Time.minutes(15));
});

Deno.test("escalationFor softens a bucket shared behind one address", () => {
  const escalation = escalationFor(CallerKind.Address, DECLARED);

  assertEquals(escalation.maxPenalty, SHARED_ADDRESS_MAX_PENALTY);
  assertEquals(escalation.strikeMemory, SHARED_ADDRESS_STRIKE_MEMORY);
});

Deno.test("escalationFor leaves an attributable bucket at its declared penalty", () => {
  assertEquals(escalationFor(CallerKind.Identity, DECLARED), DECLARED);
  assertEquals(escalationFor(CallerKind.Global, DECLARED), DECLARED);
});

Deno.test("escalationFor never lengthens what an address already declared short", () => {
  const escalation = escalationFor(CallerKind.Address, {
    maxPenalty: Time.minutes(1),
    strikeMemory: Time.minutes(1),
  });

  assertEquals(escalation.maxPenalty, Time.minutes(1));
  assertEquals(escalation.strikeMemory, Time.minutes(1));
});

Deno.test("allow reports the full quota as remaining", () => {
  assertEquals(allow(10), { ok: true, remaining: 10 });
});

Deno.test("block asks the caller to come back after the window, in seconds", () => {
  assertEquals(block(Time.seconds(90)), {
    ok: false,
    error: RateLimitError.Limited,
    retryAfter: 90,
    strikes: 0,
  });
});

Deno.test("fallback carries the failOpen decision, both ways", () => {
  assertEquals(fallback(true, 5, Time.minutes(1)).ok, true);
  assertEquals(fallback(false, 5, Time.minutes(1)).ok, false);
});
