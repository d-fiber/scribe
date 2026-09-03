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

import "@scribe/runtime/scholium/runner.ts";
import { Scribe } from "@scribe/alchemy/test";
import { HmacTokenVerifier } from "@scribe/shell/platform/edge/authorization/hmac_token_verifier.ts";
import { SignJWT } from "jose";
import { assert, assertEquals, assertFalse } from "@std/assert";

const SECRET = "a-shared-secret-long-enough-for-hmac-sha-512-signatures";

function signed(alg: string): Promise<string> {
  return new SignJWT({ sub: "u1", role: "authenticated" })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(SECRET));
}

Scribe.test("the shared-secret verifier takes the algorithm it declares", async () => {
  const verifier = new HmacTokenVerifier(SECRET);

  assertEquals(verifier.algorithms, ["HS256"]);
  assert(await verifier.verify(await signed("HS256")));
});

Scribe.test("the shared-secret verifier takes no algorithm it does not declare", async () => {
  const verifier = new HmacTokenVerifier(SECRET);

  for (const alg of ["HS384", "HS512"]) {
    assertFalse(
      await verifier.verify(await signed(alg)),
      `an octet key fits ${alg} too, so leaving the algorithms to the key type is a declaration nothing enforces`,
    );
  }
});

Scribe.test("the shared-secret verifier refuses a token signed with another secret", async () => {
  const other = await new SignJWT({ sub: "u1" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode("a-completely-different-shared-secret-value"));

  assertFalse(await new HmacTokenVerifier(SECRET).verify(other));
});

Scribe.test("fromSecret answers nothing when the deployment declares no secret", () => {
  assertEquals(HmacTokenVerifier.fromSecret(undefined), null);
  assertEquals(HmacTokenVerifier.fromSecret(""), null);
});
