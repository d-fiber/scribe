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
import { kv } from "@scribe/core/runtime/redis/mod.ts";
import { RateLimitBucket } from "./bucket.ts";
import { resolveCaller } from "./caller.ts";
import {
  RateLimitError,
  type RateLimiterService,
  type RateLimitOptions,
  type RateLimitPeekOptions,
  type RateLimitPeekResult,
  type RateLimitResult,
  RateLimitScope,
} from "./contract.ts";
import { escalationFor } from "./escalation.ts";
import { allow, fallback } from "./outcome.ts";
import { rateLimitCommands } from "./script.ts";

function isUsable(options: RateLimitOptions): boolean {
  const { key, limit, window, penalty } = options;
  if (limit > 0 && window.value > 0 && penalty.value > 0) return true;

  console.error(
    `[rate-limiter] invalid options for key "${key}": limit=${limit} window=${window} penalty=${penalty}`,
  );
  return false;
}

export class RateLimiterClient implements RateLimiterService {
  async check({
    key,
    limit,
    window,
    penalty,
    maxPenalty = Time.days(1),
    strikeMemory = Time.hours(24),
    failOpen = true,
    scope = RateLimitScope.Caller,
  }: RateLimitOptions): Promise<RateLimitResult> {
    if (!isUsable({ key, limit, window, penalty })) return allow(limit);

    const caller = resolveCaller(key, scope);
    if (caller === null) {
      console.error(
        `[rate-limiter] unattributable caller for key "${key}", ${
          failOpen ? "allowing" : "blocking"
        } request`,
      );
      return fallback(failOpen, limit, window);
    }

    const escalation = escalationFor(caller.kind, { maxPenalty, strikeMemory });
    const bucket = new RateLimitBucket(caller.key);

    try {
      const now = Date.now();
      const [ok, second, strikes] = await rateLimitCommands().rateLimitCheck(
        bucket.blockedKey,
        bucket.windowKey,
        bucket.strikesKey,
        limit,
        window.value,
        penalty.value,
        escalation.maxPenalty.value,
        escalation.strikeMemory.value,
        now,
        `${now}-${crypto.randomUUID()}`,
      );

      if (ok === 1) return { ok: true, remaining: second };
      return {
        ok: false,
        error: RateLimitError.Limited,
        retryAfter: second,
        strikes,
      };
    } catch (error) {
      console.error(
        `[rate-limiter] check failed for key "${key}", ${
          failOpen ? "allowing" : "blocking"
        } request:`,
        error,
      );
      return fallback(failOpen, limit, window);
    }
  }

  async peek({
    key,
    scope = RateLimitScope.Caller,
  }: RateLimitPeekOptions): Promise<RateLimitPeekResult> {
    const caller = resolveCaller(key, scope);
    if (caller === null) return { limited: false };

    try {
      const blockedFor = await kv().pttl(new RateLimitBucket(caller.key).blockedKey);
      return blockedFor > 0
        ? { limited: true, retryAfter: Math.ceil(blockedFor / 1000) }
        : { limited: false };
    } catch (error) {
      console.error(
        `[rate-limiter] peek failed for key "${key}", blocking request:`,
        error,
      );
      return { limited: true, retryAfter: 0 };
    }
  }
}
