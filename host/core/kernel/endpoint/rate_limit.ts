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

import type { Time } from "@scribe/core/contracts/common/time.ts";
import { firstSegmentOf } from "@scribe/core/runtime/http/pathname.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { rateLimiter } from "@scribe/core/runtime/redis/rate_limiter/mod.ts";

export interface RateLimiter {
  limit: number;
  window: Time;
  penalty: Time;
  maxPenalty?: Time;
  failOpen?: boolean;
}

/**
 * The rate limit key, namespaced by the node the request is on.
 *
 * A node is mounted under its own name, so the first segment of the path is
 * the node. Two nodes that declare the same route must not share a bucket:
 * `admin` and `app` both serving `/brand` are two different audiences, and one
 * hammering the endpoint must not lock the other out.
 *
 * A path with no segment -- the host answering for itself -- namespaces under
 * `host`, which no node can be called since a node name comes from a folder.
 */
export function scopedRateLimitKey(key: string): string {
  const node = firstSegmentOf(request.path());

  return `${node === "" ? "host" : node}:${key}`;
}

export async function withinRateLimit(
  key: string,
  limiter: RateLimiter,
): Promise<boolean> {
  const result = await rateLimiter.check({
    key: scopedRateLimitKey(key),
    ...limiter,
  });
  return result.ok;
}
