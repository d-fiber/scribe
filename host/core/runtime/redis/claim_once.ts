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
import { kv } from "@scribe/foundation/src/redis/mod.ts";

/** What a claim does when Redis cannot answer. */
export type WhenUnavailable = "allow" | "refuse";

/**
 * Claims `key` for `ttlSeconds`, and answers whether this caller is the first to do so.
 *
 * It is the short form of a distributed lock: there is nothing to release, because the point
 * is that the second caller loses for as long as the key lives. A nonce, a webhook delivery
 * id and an idempotency key are all the same question asked of different keys.
 *
 * `whenUnavailable` is not a default anyone should inherit. A replay index that fails open
 * lets a replayed request through, and a nonce that fails closed locks out every device the
 * moment Redis blinks — the two callers want opposite things, and each has to say which.
 */
export async function claimOnce(
  key: string,
  ttlSeconds: number,
  { whenUnavailable, scope }: { whenUnavailable: WhenUnavailable; scope: string },
): Promise<boolean> {
  try {
    return (await kv().set(key, "1", "EX", ttlSeconds, "NX")) === "OK";
  } catch (error) {
    console.error(`[${scope}] claim store unavailable:`, error);
    return whenUnavailable === "allow";
  }
}
