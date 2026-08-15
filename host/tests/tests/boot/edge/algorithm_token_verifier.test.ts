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

import { AlgorithmTokenVerifier } from "@scribe/host/boot/edge/authorization/algorithm_token_verifier.ts";
import type { TokenVerifier } from "@scribe/host/boot/edge/authorization/token_verifier.ts";
import { assert, assertEquals, assertFalse } from "@std/assert";

function base64url(value: object): string {
  return btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function tokenWithAlgorithm(alg: string): string {
  return `${base64url({ alg, typ: "JWT" })}.${base64url({ sub: "x" })}.sig`;
}

class StubVerifier implements TokenVerifier {
  calls = 0;

  constructor(
    readonly algorithms: readonly string[],
    private readonly answer: boolean,
  ) {}

  verify(): Promise<boolean> {
    this.calls++;
    return Promise.resolve(this.answer);
  }
}

Deno.test("AlgorithmTokenVerifier routes a token to the verifier owning its alg", async () => {
  const hmac = new StubVerifier(["HS256"], true);
  const jwks = new StubVerifier(["ES256", "RS256"], false);
  const verifier = new AlgorithmTokenVerifier([hmac, jwks]);

  assert(await verifier.verify(tokenWithAlgorithm("HS256")));
  assertEquals(hmac.calls, 1);
  assertEquals(jwks.calls, 0);

  assertFalse(await verifier.verify(tokenWithAlgorithm("RS256")));
  assertEquals(jwks.calls, 1);
});

Deno.test("AlgorithmTokenVerifier rejects an algorithm nobody claims", async () => {
  const verifier = new AlgorithmTokenVerifier([
    new StubVerifier(["HS256"], true),
  ]);

  assertFalse(await verifier.verify(tokenWithAlgorithm("none")));
});

Deno.test("AlgorithmTokenVerifier rejects a malformed token instead of throwing", async () => {
  const verifier = new AlgorithmTokenVerifier([
    new StubVerifier(["HS256"], true),
  ]);

  assertFalse(await verifier.verify("not-a-jwt"));
  assertFalse(await verifier.verify(""));
});

Deno.test("AlgorithmTokenVerifier reports every algorithm it can handle", () => {
  const verifier = new AlgorithmTokenVerifier([
    new StubVerifier(["HS256"], true),
    new StubVerifier(["ES256", "RS256"], true),
  ]);

  assertEquals([...verifier.algorithms].sort(), ["ES256", "HS256", "RS256"]);
});

Deno.test("AlgorithmTokenVerifier with no verifier accepts nothing", async () => {
  const verifier = new AlgorithmTokenVerifier([]);

  assertFalse(await verifier.verify(tokenWithAlgorithm("HS256")));
});
