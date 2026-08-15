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

const IPV4_MAPPED_PREFIX = "::ffff:";
const OCTET = /^(0|[1-9]\d{0,2})$/;

export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();

  return trimmed.startsWith(IPV4_MAPPED_PREFIX)
    ? trimmed.slice(IPV4_MAPPED_PREFIX.length)
    : trimmed;
}

export function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!OCTET.test(part)) return null;

    const octet = Number(part);
    if (octet > 255) return null;

    value = value * 256 + octet;
  }

  return value;
}

export function isInSubnetPrefix(ip: string, prefix: string): boolean {
  if (!prefix.endsWith(".")) return false;

  const candidate = normalizeIp(ip);
  if (ipv4ToInt(candidate) === null) return false;

  return candidate.startsWith(prefix);
}
