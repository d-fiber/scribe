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
import { RateLimit, SHARED_ADDRESS_MAX_PENALTY, SHARED_ADDRESS_STRIKE_MEMORY } from "@scribe/foundation/src/rate_limit/mod.ts";
import { CallerKind, requestCaller } from "@scribe/core/runtime/http/caller.ts";

export interface RateLimiter {
  limit: number;
  window: Time;
  penalty: Time;
  maxPenalty?: Time;
  failOpen?: boolean;
}

/** The shorter of `declared` and `cap`, and `cap` when nothing was declared. */
function shorter(declared: Time | undefined, cap: Time): Time {
  return declared !== undefined && declared.value < cap.value ? declared : cap;
}

/**
 * The node the request is on, which every bucket of that node is prefixed with.
 *
 * A node is mounted under its own name, so the first segment of the path is the node. Two nodes
 * that declare the same route must not share a bucket: `admin` and `app` both serving `/brand`
 * are two different audiences, and one hammering the endpoint must not lock the other out.
 *
 * A path with no segment, the host answering for itself, namespaces under `host`, which no node
 * can be called since a node name comes from a folder.
 */
export function rateLimitPrefix(): string {
  const node = firstSegmentOf(request.path());

  return node === "" ? "host" : node;
}

/**
 * Whether the caller of the current request is inside the limit `key` declares.
 *
 * A caller with no session is named by its address, and an address is shared by everyone behind
 * it, so the penalty of such a bucket is capped whatever the route asked for. A route cannot make
 * that call itself: it declares one limit and serves both kinds of caller.
 */
export async function withinRateLimit(key: string, limiter: RateLimiter): Promise<boolean> {
  const caller = requestCaller();
  if (caller === null) return limiter.failOpen ?? true;

  const shared = caller.kind === CallerKind.Address;
  const limit = new RateLimit({
    ...limiter,
    key,
    maxPenalty: shared ? shorter(limiter.maxPenalty, SHARED_ADDRESS_MAX_PENALTY) : limiter.maxPenalty,
    strikeMemory: shared ? SHARED_ADDRESS_STRIKE_MEMORY : undefined,
  });

  const result = await limit.check(rateLimitPrefix(), caller.id);
  return result.ok;
}
