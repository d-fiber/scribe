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

import { PendingToken, PendingTokenPurpose } from "@scribe/auth/src/pending_token.ts";
import { type Vpn, vpn, VpnAccessError, VpnAccessLink, VpnError } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { Failure, Ok } from "@scribe/alchemy";
import { installAuthMock } from "@scribe/auth/testing/mock.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import { forgeToken } from "@scribe/host/dependencies/security/vpn/testing/pending_token.ts";
import { assert, assertEquals, assertStringIncludes } from "@std/assert";

const ADMIN = "admin-1";
const CONFIG = "[Interface]\nPrivateKey=super-secret\n";
const IDENTITY = { firstName: "Ada", lastName: "Lovelace" };

function peer(): Vpn {
  return {
    id: "peer-1",
    name: ADMIN,
    enabled: true,
    address: "10.8.0.2",
    publicKey: "pub",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    latestHandshakeAt: null,
    transferRx: 0,
    transferTx: 0,
    persistentKeepalive: "off",
    allowedIPs: [],
  };
}

function tokenOf(url: string): string {
  return new URLSearchParams(new URL(url).hash.slice(1)).get("token")!;
}

function installVpn(options: { owned?: boolean } = {}) {
  const owned = options.owned ?? true;
  const mocks = [
    installMock(
      vpn,
      "getByOwner",
      () =>
        Promise.resolve(
          owned ? new Ok(peer()) : new Failure(VpnError.NotFound),
        ) as never,
    ),
    installMock(
      vpn,
      "configuration",
      () => Promise.resolve(new Ok(CONFIG)) as never,
    ),
  ];
  return { restore: () => mocks.forEach((m) => m.restore()) };
}

Deno.test("issue: the link carries a token and points at the hosting page", async () => {
  const database = installAuthMock();
  try {
    const url = await VpnAccessLink.issue(ADMIN);

    assert(url !== null);
    assertStringIncludes(url, "/functions/v1/hosting/vpn#token=");
    assertEquals(
      new URL(url).search,
      "",
      "the token grants network access: in a query string it lands in the Kong and Caddy access logs, so it must travel in the fragment",
    );
    assertEquals(
      database.rows("__pending_tokens__").length,
      1,
      "the link is only usable because its hash is stored: issuing must persist",
    );
    assertEquals(
      url.includes(CONFIG),
      false,
      "the configuration itself must never travel in the mail",
    );
  } finally {
    database.restore();
  }
});

Deno.test("redeem: a fresh token returns the configuration and burns the token", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    const result = await VpnAccessLink.redeem(token, IDENTITY);

    assert(result.ok);
    assertEquals(result.data.content, CONFIG);
    assertEquals(result.data.filename, "ada-lovelace-vpn.conf");
    assertEquals(database.rows("__pending_tokens__").length, 0);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: the same link cannot be used twice", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    assert((await VpnAccessLink.redeem(token, IDENTITY)).ok);
    const replay = await VpnAccessLink.redeem(token, IDENTITY);

    assert(!replay.ok);
    assertEquals(replay.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: a token never stored is refused even though it is well signed", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const forged = await forgeToken(ADMIN, "admin", {});

    const result = await VpnAccessLink.redeem(forged, IDENTITY);

    assert(!result.ok);
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: a sign-in token cannot be replayed as a vpn link", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const signIn = await forgeToken(ADMIN, "admin", { purpose: "sign-in" });

    const result = await VpnAccessLink.redeem(signIn!, IDENTITY);

    assert(!result.ok, "PENDING_TOKEN_SECRET is shared across purposes");
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: a user-role token is refused on an admin-only link", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const asUser = await new PendingToken(PendingTokenPurpose.VpnAccess).issue(ADMIN, "user", null);

    const result = await VpnAccessLink.redeem(asUser!, IDENTITY);

    assert(!result.ok);
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: an expired token is refused", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const expired = await forgeToken(ADMIN, "admin", {
      expiresAt: Date.now() - 1_000,
    });

    const result = await VpnAccessLink.redeem(expired, IDENTITY);

    assert(!result.ok);
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: garbage is refused without throwing", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    for (const bad of ["", "   ", "nope", "a.b", "x".repeat(4000)]) {
      const result = await VpnAccessLink.redeem(bad, IDENTITY);
      assert(!result.ok, `"${bad.slice(0, 8)}" must be refused`);
    }
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: a revoked owner gets nothing, and the token is still spent", async () => {
  const database = installAuthMock();
  const vpn = installVpn({ owned: false });
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    const result = await VpnAccessLink.redeem(token, IDENTITY);

    assert(!result.ok);
    assertEquals(database.rows("__pending_tokens__").length, 0);
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("redeem: the filename falls back when the profile is incomplete", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    const result = await VpnAccessLink.redeem(token, {
      firstName: null,
      lastName: null,
    });

    assert(result.ok);
    assertEquals(result.data.filename, "vpn.conf");
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("ownerOf: reads the owner without consuming the token", async () => {
  const database = installAuthMock();
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    assertEquals(await VpnAccessLink.ownerOf(token), ADMIN);
    assertEquals(
      database.rows("__pending_tokens__").length,
      1,
      "the POST resolves the owner before redeeming: reading must not burn the token",
    );
    assertEquals(await VpnAccessLink.ownerOf("nonsense"), null);
  } finally {
    database.restore();
  }
});

Deno.test("ownerOf: a spent token no longer names its owner", async () => {
  const database = installAuthMock();
  const vpn = installVpn();
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    assert((await VpnAccessLink.redeem(token, IDENTITY)).ok);

    assertEquals(
      await VpnAccessLink.ownerOf(token),
      null,
      "the signature stays valid forever: only the stored hash tells a live token from a spent one",
    );
  } finally {
    vpn.restore();
    database.restore();
  }
});

Deno.test("ownerOf: a well-signed token that was never stored names nobody", async () => {
  const database = installAuthMock();
  try {
    const forged = await forgeToken(ADMIN, "admin", {});

    assertEquals(await VpnAccessLink.ownerOf(forged), null);
  } finally {
    database.restore();
  }
});
