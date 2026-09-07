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

/** How far into the past a payload's `iat` may sit and still count as fresh. */
export const DEVICE_PAYLOAD_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * How far into the future a payload's `iat` may sit and still count as fresh.
 *
 * @remarks
 * Far tighter than {@link DEVICE_PAYLOAD_MAX_AGE_MS}: a client clock running ahead is the only
 * honest reason for a future timestamp at all, and it never runs ahead by minutes the way a
 * replayed payload can sit unused for minutes in the past.
 */
export const DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS = 60 * 1000;

/**
 * Whether `iat` sits within {@link DEVICE_PAYLOAD_MAX_AGE_MS} in the past or
 * {@link DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS} in the future of now.
 *
 * @remarks
 * False for anything that is not a finite number, a non-numeric `iat` being as stale as one that
 * is simply out of window.
 */
export function isFresh(iat: unknown): boolean {
  if (typeof iat !== "number" || !Number.isFinite(iat)) return false;

  const age = Date.now() - iat;
  return age <= DEVICE_PAYLOAD_MAX_AGE_MS &&
    age >= -DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS;
}
