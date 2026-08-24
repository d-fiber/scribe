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

import { type Duration, rateLimit } from "@scribe/alchemy";
import type { RateLimit } from "@scribe/alchemy/route";
import { firstSegmentOf } from "@scribe/core/runtime/http/pathname.ts";
import { request } from "@scribe/core/runtime/http/request.ts";
import { SHARED_ADDRESS_MAX_PENALTY, SHARED_ADDRESS_STRIKE_MEMORY } from "@scribe/foundation/lib/src/rate_limit/mod.ts";
import { CallerKind, requestCaller } from "@scribe/core/runtime/http/caller.ts";

/** The shorter of `declared` and `cap`, and `cap` when nothing was declared. */
function shorter(declared: Duration | undefined, cap: Duration): Duration {
  return declared !== undefined && declared.inSeconds < cap.inSeconds ? declared : cap;
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
export async function withinRateLimit(key: string, limiter: RateLimit): Promise<boolean> {
  const caller = requestCaller();
  if (caller === null) return limiter.failOpen ?? true;

  const shared = caller.kind === CallerKind.Address;
  const limit = rateLimit({
    ...limiter,
    key,
    maxPenalty: shared ? shorter(limiter.maxPenalty, SHARED_ADDRESS_MAX_PENALTY) : limiter.maxPenalty,
    strikeMemory: shared ? SHARED_ADDRESS_STRIKE_MEMORY : undefined,
  });

  const result = await limit.check(rateLimitPrefix(), caller.id);
  return result.ok;
}
