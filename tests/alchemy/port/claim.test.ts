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

import { assert, assertEquals, assertFalse } from "@std/assert";
import { type ClaimDriver, claimOnce, type ClaimOptions, Claims } from "@scribe/alchemy";

class TakenOnce implements ClaimDriver {
  readonly held = new Set<string>();

  claim(key: string, _ttlSeconds: number, _options: ClaimOptions): Promise<boolean> {
    if (this.held.has(key)) return Promise.resolve(false);
    this.held.add(key);
    return Promise.resolve(true);
  }
}

class Unreachable implements ClaimDriver {
  claim(_key: string, _ttlSeconds: number, options: ClaimOptions): Promise<boolean> {
    return Promise.resolve(options.whenUnavailable === "allow");
  }
}

function through<T>(driver: ClaimDriver, body: () => Promise<T>): Promise<T> {
  const held = Claims.configured ? Claims.get() : null;
  Claims.use(driver);
  return body().finally(() => {
    if (held !== null) Claims.use(held);
  });
}

const ASKING: ClaimOptions = { whenUnavailable: "refuse", scope: "test" };

Deno.test("the first caller takes the claim and the second is told it did not", async () => {
  await through(new TakenOnce(), async () => {
    assert(await claimOnce("once", 30, ASKING), "the first caller was refused");
    assertFalse(await claimOnce("once", 30, ASKING), "a second caller was told it took the same claim");
  });
});

Deno.test("two names are two claims", async () => {
  await through(new TakenOnce(), async () => {
    assert(await claimOnce("a", 30, ASKING));
    assert(await claimOnce("b", 30, ASKING), "a claim on one name blocked another");
  });
});

Deno.test("a store nobody can reach answers what the caller asked it to", async () => {
  await through(new Unreachable(), async () => {
    assertEquals(
      await claimOnce("nonce", 30, { whenUnavailable: "allow", scope: "device-payload" }),
      true,
      "a device that cannot reach the store was locked out instead of let through",
    );
    assertEquals(
      await claimOnce("webhook", 30, { whenUnavailable: "refuse", scope: "webhook-replay" }),
      false,
      "a guard against a repeat let one through when the store was down",
    );
  });
});
