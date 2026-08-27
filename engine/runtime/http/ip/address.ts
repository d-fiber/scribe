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

const IPV4_MAPPED_PREFIX = "::ffff:";
const OCTET = /^(0|[1-9]\d{0,2})$/;

export function normalizeIp(ip: string): string {
  const trimmed = ip.trim();

  return trimmed.startsWith(IPV4_MAPPED_PREFIX) ? trimmed.slice(IPV4_MAPPED_PREFIX.length) : trimmed;
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

/**
 * The longest an address may be written, which is a full IPv6 with an embedded IPv4 tail.
 *
 * `ffff:ffff:ffff:ffff:ffff:ffff:255.255.255.255` is forty-five characters, and nothing an
 * address parser accepts is longer.
 */
const MAX_ADDRESS_CHARS = 45;

/**
 * Whether `value` names an address at all.
 *
 * @remarks
 * What arrives in `x-real-ip` is a header, and a header is whatever the sender put in it. The
 * value ends up naming a rate limit bucket, a geolocation cache entry and the `ip` a worker is
 * handed, so an unchecked one is a caller choosing its own bucket on every call and writing a
 * key of its own length into Redis.
 *
 * IPv4 is answered by {@link ipv4ToInt} and never reaches the parser, which is every address a
 * deployment sees in practice. IPv6 is handed to the platform's own host parser rather than to a
 * pattern of ours: it is the same trade `pathnameOf` makes, being exactly right on the awkward
 * spellings mattering more than being clever about them.
 */
export function isIpAddress(value: string): boolean {
  if (value.length === 0 || value.length > MAX_ADDRESS_CHARS) return false;
  if (ipv4ToInt(value) !== null) return true;
  if (!value.includes(":")) return false;

  try {
    return new URL(`http://[${value}]/`).hostname.length > 0;
  } catch {
    return false;
  }
}

export function isInSubnetPrefix(ip: string, prefix: string): boolean {
  if (!prefix.endsWith(".")) return false;

  const candidate = normalizeIp(ip);
  if (ipv4ToInt(candidate) === null) return false;

  return candidate.startsWith(prefix);
}
