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

import { PendingToken } from "@scribe/host/dependencies/security/vpn/src/pending_token.ts";
import { type Vpn, vpn, VpnAccessError, VpnAccessLink, VpnError } from "@scribe/host/dependencies/security/vpn/mod.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { Failure, OK } from "@scribe/core/contracts/result.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
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
          owned ? new OK(peer()) : new Failure(VpnError.NotFound),
        ) as never,
    ),
    installMock(
      vpn,
      "configuration",
      () => Promise.resolve(new OK(CONFIG)) as never,
    ),
  ];
  return { restore: () => mocks.forEach((m) => m.restore()) };
}

Deno.test("issue: the link carries a token and points at the hosting page", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
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
      rest.rows("internal_t__otp_pending_tokens").length,
      1,
      "the link is only usable because its hash is stored: issuing must persist",
    );
    assertEquals(
      url.includes(CONFIG),
      false,
      "the configuration itself must never travel in the mail",
    );
  } finally {
    rest.restore();
  }
});

Deno.test("redeem: a fresh token returns the configuration and burns the token", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn();
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    const result = await VpnAccessLink.redeem(token, IDENTITY);

    assert(result.ok);
    assertEquals(result.data.content, CONFIG);
    assertEquals(result.data.filename, "ada-lovelace-vpn.conf");
    assertEquals(rest.rows("internal_t__otp_pending_tokens").length, 0);
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: the same link cannot be used twice", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
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
    rest.restore();
  }
});

Deno.test("redeem: a token never stored is refused even though it is well signed", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn();
  try {
    const forged = await forgeToken(ADMIN, AccountRole.Admin, {});

    const result = await VpnAccessLink.redeem(forged, IDENTITY);

    assert(!result.ok);
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: a sign-in token cannot be replayed as a vpn link", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn();
  try {
    const signIn = await forgeToken(ADMIN, AccountRole.Admin, { purpose: "sign-in" });

    const result = await VpnAccessLink.redeem(signIn!, IDENTITY);

    assert(!result.ok, "PENDING_TOKEN_SECRET is shared across purposes");
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: a user-role token is refused on an admin-only link", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn();
  try {
    const asUser = await new PendingToken().issue(ADMIN, AccountRole.User, null);

    const result = await VpnAccessLink.redeem(asUser!, IDENTITY);

    assert(!result.ok);
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: an expired token is refused", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn();
  try {
    const expired = await forgeToken(ADMIN, AccountRole.Admin, {
      expiresAt: Date.now() - 1_000,
    });

    const result = await VpnAccessLink.redeem(expired, IDENTITY);

    assert(!result.ok);
    assertEquals(result.error, VpnAccessError.InvalidOrExpiredToken);
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: garbage is refused without throwing", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn();
  try {
    for (const bad of ["", "   ", "nope", "a.b", "x".repeat(4000)]) {
      const result = await VpnAccessLink.redeem(bad, IDENTITY);
      assert(!result.ok, `"${bad.slice(0, 8)}" must be refused`);
    }
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: a revoked owner gets nothing, and the token is still spent", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  const vpn = installVpn({ owned: false });
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    const result = await VpnAccessLink.redeem(token, IDENTITY);

    assert(!result.ok);
    assertEquals(rest.rows("internal_t__otp_pending_tokens").length, 0);
  } finally {
    vpn.restore();
    rest.restore();
  }
});

Deno.test("redeem: the filename falls back when the profile is incomplete", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
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
    rest.restore();
  }
});

Deno.test("ownerOf: reads the owner without consuming the token", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  try {
    const url = await VpnAccessLink.issue(ADMIN);
    const token = tokenOf(url!);

    assertEquals(await VpnAccessLink.ownerOf(token), ADMIN);
    assertEquals(
      rest.rows("internal_t__otp_pending_tokens").length,
      1,
      "the POST resolves the owner before redeeming: reading must not burn the token",
    );
    assertEquals(await VpnAccessLink.ownerOf("nonsense"), null);
  } finally {
    rest.restore();
  }
});

Deno.test("ownerOf: a spent token no longer names its owner", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
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
    rest.restore();
  }
});

Deno.test("ownerOf: a well-signed token that was never stored names nobody", async () => {
  const rest = installRestMock({ internal_t__otp_pending_tokens: [] });
  try {
    const forged = await forgeToken(ADMIN, AccountRole.Admin, {});

    assertEquals(await VpnAccessLink.ownerOf(forged), null);
  } finally {
    rest.restore();
  }
});
