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

import { Slot } from "../bind/slot.ts";
import type { Future } from "../async/future.ts";

/** What a claim does when the store behind it cannot be reached. */
export type WhenUnavailable = "allow" | "refuse";

/** What one claim asks for. */
export interface ClaimOptions {
  /**
   * The answer when the store is unreachable.
   *
   * `allow` lets the caller through, which is what a claim guarding something a
   * user cannot retry wants: a device that cannot reach the nonce store cannot
   * sign in at all, and refusing it turns an outage into a lockout. `refuse` is
   * for a claim guarding something that must never happen twice.
   */
  readonly whenUnavailable: WhenUnavailable;

  /** What the claim is for, named so a refusal says which one it was. */
  readonly scope: string;
}

/** What takes a claim, once. */
export interface ClaimDriver {
  /**
   * Takes `key` for `ttlSeconds`, and answers whether this caller is the one that took it.
   *
   * A second call with the same key answers false until the claim runs out. The
   * answer when the store cannot be reached is `options.whenUnavailable`.
   */
  claim(key: string, ttlSeconds: number, options: ClaimOptions): Future<boolean>;
}

/**
 * What answers a caller that needs something to happen once.
 *
 * @remarks
 * The host fills this at boot with whatever it runs against. A layer reads it and
 * never names a store, which is what keeps a nonce, a webhook replay guard and a
 * one-shot job on the same primitive without any of them reaching a package.
 */
export const Claims: Slot<ClaimDriver> = new Slot<ClaimDriver>("Claims");

/**
 * Takes `key` for `ttlSeconds`, through whatever the host filled {@link Claims} with.
 *
 * @param key - The claim's name, which is what a second caller collides on.
 * @param ttlSeconds - How long the claim is held before it can be taken again.
 * @param options - What the claim does when the store is unreachable, and what it is for.
 * @returns Whether this caller is the one that took it.
 */
export function claimOnce(key: string, ttlSeconds: number, options: ClaimOptions): Future<boolean> {
  return Claims.get().claim(key, ttlSeconds, options);
}
