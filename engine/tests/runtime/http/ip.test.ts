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

import {
  ipv4ToInt,
  isInSubnetPrefix,
  isPrivateIp,
  isTrustedProxy,
  normalizeIp,
  resolveClientIp,
} from "@scribe/runtime/http/ip/mod.ts";
import { request } from "@scribe/runtime/http/request.ts";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { assert, assertEquals, assertFalse } from "@std/assert";

const TRUSTED_PEER = "172.18.0.4";
const PUBLIC_PEER = "203.0.113.7";

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

function withPeer<T>(
  peer: string | null,
  values: Record<string, string>,
  run: () => T,
): T {
  const req = new Request("http://api.test/", { headers: headers(values) });
  return RequestScope.run(req, new Uint8Array(0), run, peer);
}

Deno.test("resolveClientIp reads x-real-ip and ignores client-controlled hops", () => {
  const resolved = resolveClientIp(
    headers({
      "x-real-ip": "9.9.9.9",
      "x-forwarded-for": "1.1.1.1",
      "cf-connecting-ip": "2.2.2.2",
    }),
    TRUSTED_PEER,
  );

  assertEquals(resolved, "9.9.9.9");
});

Deno.test("resolveClientIp yields nothing when the peer is not a trusted proxy", () => {
  assertEquals(
    resolveClientIp(headers({ "x-real-ip": "10.8.0.5" }), PUBLIC_PEER),
    "",
    "x-real-ip is only meaningful because Caddy overwrites it: reached directly, the header is attacker-controlled",
  );
});

Deno.test("resolveClientIp yields nothing when there is no peer at all", () => {
  assertEquals(resolveClientIp(headers({ "x-real-ip": "10.8.0.5" }), null), "");
});

Deno.test("resolveClientIp never reads a hop header, whoever the peer is", () => {
  assertEquals(
    resolveClientIp(
      headers({ "x-forwarded-for": "203.0.113.9", "cf-connecting-ip": "1.1.1.1" }),
      TRUSTED_PEER,
    ),
    "",
    "x-forwarded-for and cf-connecting-ip are set by the client: there is no mode that reads them",
  );
});

Deno.test("resolveClientIp hands back a plain IPv4, mapping unwrapped", () => {
  assertEquals(
    resolveClientIp(headers({ "x-real-ip": "::ffff:9.9.9.9" }), TRUSTED_PEER),
    "9.9.9.9",
    "one client must land in one rate-limit bucket, whichever form the socket reported",
  );
});

Deno.test("isTrustedProxy only accepts private peers", () => {
  for (const peer of ["127.0.0.1", "172.18.0.4", "10.0.0.9", "192.168.1.20"]) {
    assert(isTrustedProxy(peer), `${peer} runs on the internal network`);
  }
  for (const peer of ["203.0.113.7", "8.8.8.8", null, ""]) {
    assertFalse(isTrustedProxy(peer), `${peer} must never be trusted`);
  }

  assertFalse(
    isTrustedProxy("100.64.0.1"),
    "CGNAT is private-ish for a client address, but it is never one of our proxies",
  );
  assertFalse(
    isTrustedProxy("169.254.1.1"),
    "link-local is not a proxy either",
  );
});

Deno.test("isTrustedProxy accepts an internal peer reported IPv4-mapped", () => {
  for (const peer of ["::ffff:127.0.0.1", "::ffff:172.18.0.4", "::ffff:10.0.0.9"]) {
    assert(
      isTrustedProxy(peer),
      `${peer} is the same Docker-network peer a dual-stack socket reports: refusing it locks the admin API out`,
    );
  }

  assertFalse(isTrustedProxy("::ffff:8.8.8.8"), "mapping a public address does not make it internal");
});

Deno.test("isTrustedProxy accepts the two IPv6 forms of the internal network", () => {
  assert(isTrustedProxy("::1"));
  assert(isTrustedProxy("fd00::1"));
  assertFalse(isTrustedProxy("fe80::1"), "link-local is not a proxy");
  assertFalse(isTrustedProxy("2001:db8::1"));
});

Deno.test("isPrivateIp covers loopback, RFC1918, link-local and CGNAT", () => {
  for (
    const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "192.168.0.1",
      "172.16.0.1",
      "172.31.255.255",
      "169.254.1.1",
      "100.64.0.1",
      "100.127.255.255",
      "::1",
      "fd00::1",
      "fe80::1",
    ]
  ) {
    assert(isPrivateIp(ip), `${ip} is private`);
  }

  for (const ip of ["8.8.8.8", "203.0.113.7", "172.32.0.1", "100.128.0.1"]) {
    assertFalse(isPrivateIp(ip), `${ip} is public`);
  }
});

Deno.test("isPrivateIp judges the address, not its IPv6 wrapper", () => {
  assertFalse(
    isPrivateIp("::ffff:8.8.8.8"),
    "a mapped public address is public: calling it private drops the client's geolocation",
  );
  assert(isPrivateIp("::ffff:10.0.0.9"));
});

Deno.test("isPrivateIp does not mistake a public address for loopback", () => {
  assertFalse(
    isPrivateIp("::1234:5678"),
    "only ::1 itself is loopback, not everything that starts with it",
  );
});

Deno.test("ipv4ToInt refuses what is not four plain octets", () => {
  assertEquals(ipv4ToInt("10.8.0.5"), 168296453);
  assertEquals(ipv4ToInt("0.0.0.0"), 0);
  assertEquals(ipv4ToInt("255.255.255.255"), 4294967295);

  for (const malformed of ["10.8.0.", "10.8.0", "10.8.0.5.6", " 10.8.0.5", "1e2.0.0.1", "010.8.0.5", "10.8.0.256"]) {
    assertEquals(ipv4ToInt(malformed), null, `${malformed} is not an IPv4 address`);
  }
});

Deno.test("normalizeIp unwraps the IPv4 mapping and leaves the rest alone", () => {
  assertEquals(normalizeIp("::ffff:10.8.0.5"), "10.8.0.5");
  assertEquals(normalizeIp(" 10.8.0.5 "), "10.8.0.5");
  assertEquals(normalizeIp("fd00::1"), "fd00::1");
});

Deno.test("isInSubnetPrefix refuses a prefix without its trailing dot", () => {
  assertFalse(
    isInSubnetPrefix("10.8.0.5", "10.8.0"),
    "a malformed WG_SUBNET_PREFIX must fail closed, never open the admin API",
  );
  assert(isInSubnetPrefix("10.8.0.5", "10.8.0."));
});

Deno.test("isInSubnetPrefix is not fooled by a prefix-shaped string", () => {
  assertFalse(isInSubnetPrefix("10.80.0.5", "10.8."));
  assertFalse(isInSubnetPrefix("not-an-ip", "10.8.0."));
  assertFalse(isInSubnetPrefix("10.8.0.5.6", "10.8.0."));
  assertFalse(isInSubnetPrefix("10.8.0.evil", "10.8.0."));
});

Deno.test("isInSubnetPrefix unwraps IPv4-mapped IPv6 addresses", () => {
  assert(isInSubnetPrefix("::ffff:10.8.0.5", "10.8.0."));
});

Deno.test("request.ip() carries the trusted-peer rule end to end", () => {
  assertEquals(
    withPeer(TRUSTED_PEER, { "x-real-ip": "10.8.0.5" }, () => request.ip()),
    "10.8.0.5",
  );
  assertEquals(
    withPeer(PUBLIC_PEER, { "x-real-ip": "10.8.0.5" }, () => request.ip()),
    "",
  );
});
