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

import { JwtRequestAuthorizer } from "@scribe/host/boot/edge/authorization/jwt_request_authorizer.ts";
import { OpenRequestAuthorizer } from "@scribe/host/boot/edge/authorization/request_authorizer.ts";
import type { TokenVerifier } from "@scribe/host/boot/edge/authorization/token_verifier.ts";
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
    headers: init.authorization
      ? { authorization: init.authorization }
      : undefined,
  });
}

async function codeOf(response: Response): Promise<string> {
  return ((await response.json()) as { code: string }).code;
}

Deno.test("JwtRequestAuthorizer lets a valid token through", async () => {
  const verifier = new FixedVerifier(true);
  const authorizer = new JwtRequestAuthorizer(verifier, []);

  const denial = await authorizer.authorize(
    request({ authorization: "Bearer good" }),
    "app",
  );

  assertEquals(denial, null);
  assertEquals(verifier.calls, 1);
});

Deno.test("JwtRequestAuthorizer rejects an invalid token with invalid_jwt", async () => {
  const authorizer = new JwtRequestAuthorizer(new FixedVerifier(false), []);

  const denial = await authorizer.authorize(
    request({ authorization: "Bearer bad" }),
    "app",
  );

  assertEquals(denial?.status, 401);
  assertEquals(await codeOf(denial!), "invalid_jwt");
});

Deno.test("JwtRequestAuthorizer rejects a missing or malformed header", async () => {
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

Deno.test("JwtRequestAuthorizer never challenges a preflight", async () => {
  const verifier = new FixedVerifier(false);
  const authorizer = new JwtRequestAuthorizer(verifier, []);

  const denial = await authorizer.authorize(request({ method: "OPTIONS" }), "app");

  assertEquals(denial, null);
  assertEquals(verifier.calls, 0);
});

Deno.test("JwtRequestAuthorizer exempts the services it was given", async () => {
  const verifier = new FixedVerifier(false);
  const authorizer = new JwtRequestAuthorizer(verifier, ["gotrue", "queue"]);

  assertEquals(await authorizer.authorize(request(), "gotrue"), null);
  assertEquals(await authorizer.authorize(request(), "queue"), null);
  assertEquals(verifier.calls, 0);

  const denial = await authorizer.authorize(request(), "admin");
  assertEquals(denial?.status, 401);
});

Deno.test("OpenRequestAuthorizer authorizes everything", async () => {
  const authorizer = new OpenRequestAuthorizer();

  assertEquals(await authorizer.authorize(), null);
});
