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

import { isIpAddress, normalizeIp } from "./address.ts";
import { isTrustedProxy } from "./trusted_proxy.ts";

/**
 * Where the call came from, or empty when nothing here can say.
 *
 * @remarks
 * Two things have to hold, and each answers a different lie. The peer has to be a proxy of the
 * deployment, or anybody could name themselves by writing the header. And what the header carries
 * has to be an address, or a caller behind a misconfigured proxy names itself something new on
 * every call: the value becomes a rate limit bucket, a geolocation cache key and the `ip` a
 * worker reads, and none of the three is bounded by anything else.
 *
 * Empty means unattributed, which is what a caller with no bucket already meant. It is not the
 * peer address: every call would then share the proxy's own bucket and one caller going over
 * would hold everybody out.
 */
export function resolveClientIp(
  headers: Headers,
  peerAddress: string | null,
): string {
  if (!isTrustedProxy(peerAddress)) return "";

  const realIp = headers.get("x-real-ip");
  if (realIp === null) return "";

  const address = normalizeIp(realIp);
  return isIpAddress(address) ? address : "";
}
