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

// Run with `deno task test:net` (needs --allow-net/--allow-sys see .claude/testing.md).

import { Failure } from "@scribe/core/contracts/result.ts";
import { RecoverSessionError } from "@scribe/host/dependencies/security/auth/src/session/session.ts";
import { clients } from "@scribe/host/dependencies/clients.ts";
import { assertEquals } from "@std/assert";
import { createAuthMock, installAuthMock } from "@scribe/host/dependencies/security/auth/testing/mock.ts";

Deno.test("auth automock: when() configures a deep nested path", async () => {
  const mock = createAuthMock();
  mock.when("session.recover", () => Promise.resolve(new Failure(RecoverSessionError.Unauthorized)));

  const result = await mock.target.session.recover(
    "access-token",
    "refresh-token",
  );

  assertEquals(result, new Failure(RecoverSessionError.Unauthorized));
});

Deno.test(
  "installAuthMock: swaps clients.security.auth and restores it",
  async () => {
    const original = clients.security.auth;
    const mock = installAuthMock();
    mock.when("session.recover", () => Promise.resolve(new Failure(RecoverSessionError.Unauthorized)));

    assertEquals(clients.security.auth, mock.target);
    const result = await clients.security.auth.session.recover(
      "access-token",
      "refresh-token",
    );
    assertEquals(result, new Failure(RecoverSessionError.Unauthorized));

    mock.restore();
    assertEquals(clients.security.auth, original);
  },
);
