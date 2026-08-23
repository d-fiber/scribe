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

import { equals, expect } from "../../../src/test/mod.ts";
import {
  type Caller,
  InvocationContext,
  type Invoked,
  type Need,
  NEEDS_DEVICE,
  Post,
  type RateLimit,
} from "../../../src/api/route/mod.ts";
import { Duration } from "../../../mod.ts";

const CALL: Invoked = {
  invocationId: "call-1",
  traceId: "trace-1",
  user: { id: "ada", email: "", caller: "authenticated", role: "member", permissions: [] },
  method: "POST",
  path: "/app/favorites",
  ip: "127.0.0.1",
  userAgent: "",
  sessionId: null,
  pathParams: {},
  query: {},
  headers: {},
  body: null,
  device: null,
  location: null,
};

class Bare extends Post {
  protected override run(): Response {
    return this.response.ok();
  }
}

class Guarded extends Post {
  protected override access(): Caller {
    return "authenticated";
  }

  protected override permissions(): string[] {
    return ["favorites:write"];
  }

  protected override rateLimit(): RateLimit {
    return { limit: 30, window: Duration.minutes(1), penalty: Duration.minutes(1) };
  }

  protected override needs(): Need[] {
    return [NEEDS_DEVICE];
  }

  protected override description(): string {
    return "Adds a brand to the favorites of the caller.";
  }

  protected override run(): Response {
    return this.response.ok();
  }
}

Deno.test("an endpoint carries the verb its base names, and nothing else declares it", () => {
  expect(new Bare().method, equals("post"));
});

Deno.test("an endpoint that declares nothing requires nothing", () => {
  const contributed = new Bare().contribution();

  expect(contributed.access, equals(null));
  expect(contributed.permissions, equals([]));
  expect(contributed.rateLimit, equals(null));
  expect(contributed.needs, equals([]));
});

Deno.test("what an endpoint declares is read without running it", () => {
  const contributed = new Guarded().contribution();

  expect(contributed.access, equals("authenticated"));
  expect(contributed.permissions, equals(["favorites:write"]));
  expect(contributed.rateLimit?.limit, equals(30));
  expect(contributed.rateLimit?.window.inMinutes, equals(1));
  expect(contributed.needs, equals([NEEDS_DEVICE]));
});

Deno.test("what an endpoint says about itself is read the same way", () => {
  expect(
    new Guarded().documentation(),
    equals({
      method: "post",
      description: "Adds a brand to the favorites of the caller.",
    }),
  );
});

Deno.test("handling a call answers what run answered, whether it awaited or not", async () => {
  const answer = await new Bare().handle(new InvocationContext(CALL));

  expect(answer.status, equals(200));
});
