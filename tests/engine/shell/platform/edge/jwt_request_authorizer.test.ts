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
import { JwtRequestAuthorizer } from "@scribe/shell/platform/edge/authorization/jwt_request_authorizer.ts";
import { OpenRequestAuthorizer } from "@scribe/shell/platform/edge/authorization/request_authorizer.ts";
import type { TokenVerifier } from "@scribe/shell/platform/edge/authorization/token_verifier.ts";
import { assertEquals } from "@std/assert";

class FixedVerifier implements TokenVerifier {
  readonly algorithms = ["HS256"];
  calls = 0;

  constructor(private readonly answer: boolean) {}

  verify(): Promise<boolean> {
    this.calls++;
    return Promise.resolve(this.answer);
  }
}

function request(init: { method?: string; authorization?: string } = {}) {
  return new Request("http://localhost/gotrue/email", {
    method: init.method ?? "POST",
    headers: init.authorization ? { authorization: init.authorization } : undefined,
  });
}

async function codeOf(response: Response): Promise<string> {
  return ((await response.json()) as { code: string }).code;
}

Scribe.test("JwtRequestAuthorizer lets a valid token through", async () => {
  const verifier = new FixedVerifier(true);
  const authorizer = new JwtRequestAuthorizer(verifier, []);

  const denial = await authorizer.authorize(
    request({ authorization: "Bearer good" }),
    "app",
  );

  assertEquals(denial, null);
  assertEquals(verifier.calls, 1);
});

Scribe.test("JwtRequestAuthorizer rejects an invalid token with invalid_jwt", async () => {
  const authorizer = new JwtRequestAuthorizer(new FixedVerifier(false), []);

  const denial = await authorizer.authorize(
    request({ authorization: "Bearer bad" }),
    "app",
  );

  assertEquals(denial?.status, 401);
  assertEquals(await codeOf(denial!), "invalid_jwt");
});

Scribe.test("JwtRequestAuthorizer rejects a missing or malformed header", async () => {
  const verifier = new FixedVerifier(true);
  const authorizer = new JwtRequestAuthorizer(verifier, []);

  for (const header of [undefined, "Basic abc", "Bearer", "Bearer "]) {
    const denial = await authorizer.authorize(
      request({ authorization: header }),
      "app",
    );
    assertEquals(denial?.status, 401, `header: ${header}`);
  }

  assertEquals(verifier.calls, 0);
});

Scribe.test("JwtRequestAuthorizer never challenges a preflight", async () => {
  const verifier = new FixedVerifier(false);
  const authorizer = new JwtRequestAuthorizer(verifier, []);

  const denial = await authorizer.authorize(request({ method: "OPTIONS" }), "app");

  assertEquals(denial, null);
  assertEquals(verifier.calls, 0);
});

Scribe.test("JwtRequestAuthorizer exempts the services it was given", async () => {
  const verifier = new FixedVerifier(false);
  const authorizer = new JwtRequestAuthorizer(verifier, ["gotrue", "queue"]);

  assertEquals(await authorizer.authorize(request(), "gotrue"), null);
  assertEquals(await authorizer.authorize(request(), "queue"), null);
  assertEquals(verifier.calls, 0);

  const denial = await authorizer.authorize(request(), "admin");
  assertEquals(denial?.status, 401);
});

Scribe.test("OpenRequestAuthorizer authorizes everything", async () => {
  const authorizer = new OpenRequestAuthorizer();

  assertEquals(await authorizer.authorize(), null);
});
