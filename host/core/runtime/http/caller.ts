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

import type { RateLimit, RateLimitOutcome } from "@scribe/foundation/src/rate_limit/mod.ts";
import { currentIdentity } from "@scribe/core/runtime/http/accessors/identity.ts";
import { request } from "@scribe/core/runtime/http/request.ts";

/**
 * What a rate limit bucket was attributed to.
 *
 * It is not decoration: an address is shared by everyone behind it, so a limit keyed on one
 * punishes bystanders and is declared with a shorter ceiling than a limit keyed on an account.
 * See `SHARED_ADDRESS_MAX_PENALTY`.
 */
export enum CallerKind {
  /** A signed-in account, named by the identity the request carries. */
  Identity = "identity",

  /** An anonymous caller, named by the address the request came from. */
  Address = "address",
}

/** Who is calling, as far as the request scope can say. */
export interface RequestCaller {
  /** The segment that names this caller inside a rate limit key. */
  readonly id: string;

  /** What that segment names. */
  readonly kind: CallerKind;
}

/**
 * Who is calling, or `null` when the request scope cannot name anybody.
 *
 * Both accessors throw when no scope is open, which is why the whole lookup sits in one `try`: a
 * queue handler or a cron occurrence reaching a per-caller limit is a mistake in the declaration,
 * not a runtime condition to recover from.
 */
export function requestCaller(): RequestCaller | null {
  try {
    const identityId = currentIdentity()?.id;
    if (identityId) return { id: identityId, kind: CallerKind.Identity };

    const address = request.ip();
    return address.length > 0 ? { id: address, kind: CallerKind.Address } : null;
  } catch {
    return null;
  }
}

/**
 * The suffix that names `caller`, under `subject` when the bucket is about something too.
 *
 * A limit that guards one target per caller, such as failed sign-ins against one mailbox, needs
 * both in its key, and the target comes first so that every bucket about that target sorts
 * together under one glob.
 */
function suffixOf(caller: RequestCaller, subject: string): string {
  return subject === "" ? caller.id : `${subject}:${caller.id}`;
}

/**
 * Records one hit on `limit` against whoever is calling, and `subject` when there is one.
 *
 * It is the bridge between a limit, which never asks who is calling, and the request scope, which
 * is the only place that knows. A caller nobody can name gets the answer the declaration already
 * chose for a hit it cannot measure, rather than joining a bucket shared with every other unnamed
 * caller.
 */
export function checkCaller(limit: RateLimit, subject: string = ""): Promise<RateLimitOutcome> {
  const caller = requestCaller();
  if (caller === null) {
    console.error(`[rate-limit] no caller to attribute "${limit.key}" to, and no bucket to record`);
    return Promise.resolve(limit.unmeasured());
  }

  return limit.check("", suffixOf(caller, subject));
}

/** Whether whoever is calling is serving a penalty on `limit`, for `subject` when there is one. */
export function callerBlocked(limit: RateLimit, subject: string = ""): Promise<boolean> {
  const caller = requestCaller();
  if (caller === null) return Promise.resolve(!limit.failOpen);

  return limit.isBlocked("", suffixOf(caller, subject));
}
