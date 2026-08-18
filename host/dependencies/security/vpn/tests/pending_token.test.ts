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

import { PendingToken, VPN_ACCESS_PURPOSE } from "@scribe/host/dependencies/security/vpn/src/pending_token.ts";
import { forgeToken } from "@scribe/host/dependencies/security/vpn/testing/pending_token.ts";
import { AccountRole } from "@scribe/core/contracts/account.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { assert, assertEquals } from "@std/assert";

const ADMIN = "admin-1";

Deno.test("forge: a forged token verifies against the real implementation", async () => {
  const forged = await forgeToken(ADMIN, AccountRole.Admin);

  const payload = await new PendingToken().payload(forged);

  assert(
    payload !== null,
    "the forge and PendingToken must agree on the signing format, otherwise every fixture built on forgeToken is silently unverifiable",
  );
  assertEquals(payload.identifier, ADMIN);
  assertEquals(payload.role, AccountRole.Admin);
});

Deno.test("forge: the default purpose is the one this module issues", async () => {
  const forged = await forgeToken(ADMIN, AccountRole.Admin);
  const foreign = await forgeToken(ADMIN, AccountRole.Admin, {
    purpose: `${VPN_ACCESS_PURPOSE}-x`,
  });

  const token = new PendingToken();

  assert(await token.payload(forged) !== null);
  assertEquals(
    await token.payload(foreign),
    null,
    "PENDING_TOKEN_SECRET is shared with every other token holder: the purpose is what keeps them apart",
  );
});

Deno.test("issue: the copy signs what it can verify", async () => {
  const database = installDatabaseMock({ internal_t__otp_pending_tokens: [] });
  try {
    const token = new PendingToken();
    const value = await token.issue(ADMIN, AccountRole.Admin, null);

    assert(value !== null);
    const payload = await token.payload(value);

    assert(payload !== null);
    assertEquals(payload.identifier, ADMIN);
    assertEquals(
      database.rows("internal_t__otp_pending_tokens").length,
      1,
      "issuing must persist the hash, it is what consume() deletes",
    );
  } finally {
    database.restore();
  }
});

Deno.test("consume: a token is spendable exactly once", async () => {
  const database = installDatabaseMock({ internal_t__otp_pending_tokens: [] });
  try {
    const token = new PendingToken();
    const value = (await token.issue(ADMIN, AccountRole.Admin, null))!;

    assertEquals(await token.exists(value), true);
    assertEquals(await token.consume(value), true);
    assertEquals(await token.consume(value), false);
    assertEquals(await token.exists(value), false);
  } finally {
    database.restore();
  }
});
