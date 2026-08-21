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
import { forgeToken } from "@scribe/host/dependencies/security/vpn/testing/pending_token.ts";
import { installAuthMock } from "@scribe/auth/testing/mock.ts";
import { assert, assertEquals } from "@std/assert";

const ADMIN = "admin-1";

Deno.test("forge: a forged token verifies against the real implementation", async () => {
  const forged = await forgeToken(ADMIN, "admin");

  const payload = await new PendingToken(PendingTokenPurpose.VpnAccess).payload(forged);

  assert(
    payload !== null,
    "the forge and PendingToken must agree on the signing format, otherwise every fixture built on forgeToken is silently unverifiable",
  );
  assertEquals(payload.identifier, ADMIN);
  assertEquals(payload.role, "admin");
});

Deno.test("forge: the default purpose is the vpn-access one", async () => {
  const forged = await forgeToken(ADMIN, "admin");
  const foreign = await forgeToken(ADMIN, "admin", {
    purpose: `${PendingTokenPurpose.VpnAccess}-x`,
  });

  const token = new PendingToken(PendingTokenPurpose.VpnAccess);

  assert(await token.payload(forged) !== null);
  assertEquals(
    await token.payload(foreign),
    null,
    "PENDING_TOKEN_SECRET is shared with every other token holder: the purpose is what keeps them apart",
  );
});

Deno.test("issue: what this module signs is what it can verify", async () => {
  const database = installAuthMock();
  try {
    const token = new PendingToken(PendingTokenPurpose.VpnAccess);
    const value = await token.issue(ADMIN, "admin", null);

    assert(value !== null);
    const payload = await token.payload(value);

    assert(payload !== null);
    assertEquals(payload.identifier, ADMIN);
    assertEquals(
      database.rows("__pending_tokens__").length,
      1,
      "issuing must persist the hash, it is what consume() deletes",
    );
  } finally {
    database.restore();
  }
});

Deno.test("consume: a token is spendable exactly once", async () => {
  const database = installAuthMock();
  try {
    const token = new PendingToken(PendingTokenPurpose.VpnAccess);
    const value = (await token.issue(ADMIN, "admin", null))!;

    assertEquals(await token.exists(value), true);
    assertEquals(await token.consume(value), true);
    assertEquals(await token.consume(value), false);
    assertEquals(await token.exists(value), false);
  } finally {
    database.restore();
  }
});
