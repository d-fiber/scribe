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

import { equals, expect, isTrue, MemoryEnvironment } from "@scribe/alchemy/test";
import { Environments } from "@scribe/alchemy";

Deno.test("a name that was set reads the value it was set to", () => {
  const env = new MemoryEnvironment({ REDIS_URL: "redis://localhost:6379" });

  expect(env.get("REDIS_URL"), equals("redis://localhost:6379"), "the value set did not come back");
});

Deno.test("a name that was never set reads undefined, the way an unset variable does", () => {
  const env = new MemoryEnvironment({ PORT: "8080" });

  expect(env.get("NOTHING"), equals(undefined), "a name nobody set answered something");
});

Deno.test("a name set to the empty string reads the empty string, not undefined", () => {
  const env = new MemoryEnvironment({ VERIFY_JWT: "" });

  expect(env.get("VERIFY_JWT"), equals(""), "an empty value was taken as absent");
});

Deno.test("toObject hands back every name and value, and a later change does not leak into it", () => {
  const env = new MemoryEnvironment({ A: "1", B: "2" });
  const snapshot = env.toObject();
  env.set("A", "3");

  expect(snapshot, equals({ A: "1", B: "2" }), "the snapshot moved under the caller");
});

Deno.test("the slot answers with whatever a host or a test put in it", () => {
  const held = Environments.configured ? Environments.get() : null;
  Environments.use(new MemoryEnvironment({ JWT_SECRET: "shhh" }));

  try {
    expect(Environments.configured, isTrue, "the slot stayed empty after use");
    expect(Environments.get().get("JWT_SECRET"), equals("shhh"), "the slot answered with the wrong environment");
  } finally {
    if (held === null) Environments.clear();
    else Environments.use(held);
  }
});
