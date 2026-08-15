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

import { ipv4ToInt } from "./address.ts";

export interface Ipv4Range {
  readonly first: number;
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
