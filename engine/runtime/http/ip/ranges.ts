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

import { ipv4ToInt } from "./address.ts";

export interface Ipv4Range {
  /** The range's first address, as a 32-bit unsigned integer. */
  readonly first: number;

  /** The range's last address, inclusive, as a 32-bit unsigned integer. */
  readonly last: number;
}

function cidr(base: string, bits: number): Ipv4Range {
  const first = ipv4ToInt(base);
  if (first === null) {
    throw new Error(`[ip] "${base}" is not a usable IPv4 range base`);
  }

  return { first, last: first + 2 ** (32 - bits) - 1 };
}

export const LOOPBACK: Ipv4Range = cidr("127.0.0.0", 8);
export const PRIVATE_A: Ipv4Range = cidr("10.0.0.0", 8);
export const PRIVATE_B: Ipv4Range = cidr("172.16.0.0", 12);
export const PRIVATE_C: Ipv4Range = cidr("192.168.0.0", 16);
export const LINK_LOCAL: Ipv4Range = cidr("169.254.0.0", 16);
export const CGNAT: Ipv4Range = cidr("100.64.0.0", 10);

export const IPV6_LOOPBACK = "::1";
export const IPV6_UNIQUE_LOCAL_PREFIXES: readonly string[] = ["fc", "fd"];
export const IPV6_LINK_LOCAL_PREFIX = "fe80:";

export function contains(ranges: readonly Ipv4Range[], value: number): boolean {
  return ranges.some((range) => value >= range.first && value <= range.last);
}
