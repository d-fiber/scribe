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

import "@scribe/testing/settings.ts";
import type { GrantSource } from "@scribe/contracts/grants.ts";
import { GrantsResolver } from "@scribe/runtime/support/ports/grants.ts";
import { installValkeryMock } from "@scribe/foundation/testing";
import { assertEquals } from "@std/assert";

interface Counted {
  readonly calls: { roleOf: number; permissionsOf: number };
}

function sourceGranting(role: string | null, permissions: string[] = [], delayMs = 0): Counted {
  const calls = { roleOf: 0, permissionsOf: 0 };

  const source: GrantSource = {
    roleOf: () => {
      calls.roleOf++;
      return delayMs === 0 ? Promise.resolve(role) : new Promise((ok) => setTimeout(() => ok(role), delayMs));
    },
    permissionsOf: () => {
      calls.permissionsOf++;
      return Promise.resolve(permissions);
    },
  };

  installValkeryMock();
  GrantsResolver.use(source);
  return { calls };
}

Deno.test("an account the deployment grants nothing is asked about once, not once per request", async () => {
  const { calls } = sourceGranting(null);

  for (let request = 0; request < 5; request++) {
    assertEquals(await GrantsResolver.resolve("u-no-grants"), null);
  }

  assertEquals(
    calls.roleOf,
    1,
    "a deployment where most accounts carry no role would pay two queries on its whole traffic",
  );
});

Deno.test("a burst on a cold account costs the source one pair of queries", async () => {
  const { calls } = sourceGranting("lead", ["brand.read"], 10);

  const answers = await Promise.all(
    Array.from({ length: 8 }, () => GrantsResolver.resolve("u-cold")),
  );

  assertEquals(calls.roleOf, 1);
  assertEquals(calls.permissionsOf, 1);
  assertEquals(answers.every((granted) => granted?.role === "lead"), true);
});

Deno.test("a granted account is answered from this process without reaching the source again", async () => {
  const { calls } = sourceGranting("lead", ["brand.read"]);

  assertEquals((await GrantsResolver.resolve("u1"))?.permissions, ["brand.read"]);
  assertEquals((await GrantsResolver.resolve("u1"))?.permissions, ["brand.read"]);

  assertEquals(calls.roleOf, 1);
});

Deno.test("invalidating an account sends the next call back to the source", async () => {
  const { calls } = sourceGranting("lead", ["brand.read"]);

  await GrantsResolver.resolve("u1");
  await GrantsResolver.invalidate("u1");
  await GrantsResolver.resolve("u1");

  assertEquals(calls.roleOf, 2, "a demotion the process never learns of is a demotion that did not happen");
});

Deno.test("invalidating everybody sends every account back to the source", async () => {
  const { calls } = sourceGranting("lead", ["brand.read"]);

  await GrantsResolver.resolve("u1");
  await GrantsResolver.resolve("u2");
  await GrantsResolver.invalidate();
  await GrantsResolver.resolve("u1");
  await GrantsResolver.resolve("u2");

  assertEquals(calls.roleOf, 4);
});

Deno.test("a source that fails is asked again rather than remembered as a refusal", async () => {
  installValkeryMock();
  let attempts = 0;
  GrantsResolver.use({
    roleOf: () => {
      attempts++;
      return attempts === 1 ? Promise.reject(new Error("the grants table is down")) : Promise.resolve("lead");
    },
    permissionsOf: () => Promise.resolve([]),
  });

  await GrantsResolver.resolve("u1").catch(() => null);

  assertEquals((await GrantsResolver.resolve("u1"))?.role, "lead");
});
