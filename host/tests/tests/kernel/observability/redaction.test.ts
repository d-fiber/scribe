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

import { previewOf } from "@scribe/core/kernel/observability/console/body_preview.ts";
import { isSensitiveKey, redactIfJson, redactSensitive } from "@scribe/core/kernel/observability/redaction.ts";
import { assert, assertEquals, assertStringIncludes } from "@std/assert";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.test("redactSensitive hides every key the pattern matches, whatever its case", () => {
  assertEquals(
    redactSensitive({
      access_token: "secret-value",
      refreshToken: "secret-value",
      PASSWORD: "hunter2",
      Authorization: "Bearer x",
      client_secret: "shh",
      email: "kept@x.io",
    }),
    {
      access_token: "[redacted]",
      refreshToken: "[redacted]",
      PASSWORD: "[redacted]",
      Authorization: "[redacted]",
      client_secret: "[redacted]",
      email: "kept@x.io",
    },
  );
});

Deno.test("redactSensitive reaches into nested objects and arrays", () => {
  assertEquals(
    redactSensitive({
      user: { id: "u1", session: { access_token: "t" } },
      devices: [{ device_token: "d1" }, { device_token: "d2" }],
    }),
    {
      user: { id: "u1", session: { access_token: "[redacted]" } },
      devices: [{ device_token: "[redacted]" }, { device_token: "[redacted]" }],
    },
  );
});

Deno.test("redactSensitive leaves scalars and null untouched", () => {
  assertEquals(redactSensitive("plain"), "plain");
  assertEquals(redactSensitive(42), 42);
  assertEquals(redactSensitive(null), null);
});

Deno.test("redactIfJson hands back non-json text unchanged", () => {
  assertEquals(redactIfJson("not json at all"), "not json at all");
  assertEquals(redactIfJson(""), "");
});

Deno.test("redactIfJson redacts a json payload it can parse", () => {
  assertEquals(
    redactIfJson('{"password":"hunter2","id":"u1"}'),
    '{"password":"[redacted]","id":"u1"}',
  );
});

Deno.test("previewOf stays silent on a successful response", async () => {
  assertEquals(await previewOf(jsonResponse({ data: { ok: true } }, 200)), "");
  assertEquals(await previewOf(jsonResponse({ data: { ok: true } }, 302)), "");
});

Deno.test("previewOf never prints a secret carried by an error body", async () => {
  const preview = await previewOf(
    jsonResponse({ code: "bad_request", access_token: "leaked" }, 400),
  );

  assertStringIncludes(preview, "[redacted]");
  assert(!preview.includes("leaked"), "a token must never reach the console");
});

Deno.test("previewOf elides a long body from both ends", async () => {
  const preview = await previewOf(
    new Response("x".repeat(2_000), { status: 500 }),
  );

  assert(preview.includes("..."), "a long body must be elided");
  assert(preview.length < 2_000, "the whole body must not reach the console");
});

Deno.test("previewOf leaves the response readable by the caller", async () => {
  const response = jsonResponse({ code: "conflict" }, 409);

  await previewOf(response);

  assertEquals(await response.json(), { code: "conflict" });
});

Deno.test("redactSensitive covers the secret-bearing names the old pattern missed", () => {
  assertEquals(
    redactSensitive({
      api_key: "ak_live_1",
      apiKey: "ak_live_2",
      app_key: "ak_live_3",
      smtp_account_credentials: { user: "u", password: "p" },
      otp: "483920",
      token_hash: "abc",
      signature: "v1,AAA",
      x_internal_secret: "s",
      cookie: "sid=1",
      jwt: "ey.ey.sig",
    }),
    {
      api_key: "[redacted]",
      apiKey: "[redacted]",
      app_key: "[redacted]",
      smtp_account_credentials: "[redacted]",
      otp: "[redacted]",
      token_hash: "[redacted]",
      signature: "[redacted]",
      x_internal_secret: "[redacted]",
      cookie: "[redacted]",
      jwt: "[redacted]",
    },
  );
});

Deno.test("redactSensitive matches whole words, so an innocent name stays readable", () => {
  assertEquals(
    redactSensitive({
      keyword: "search terms",
      monkey: "still here",
      postal_code: "75011",
      country_code: "FR",
      authored_at: "2026-01-01",
      tokenizer: "kept",
    }),
    {
      keyword: "search terms",
      monkey: "still here",
      postal_code: "75011",
      country_code: "FR",
      authored_at: "2026-01-01",
      tokenizer: "kept",
    },
  );
});

Deno.test("isSensitiveKey splits on separators and on camel humps alike", () => {
  for (const sensitive of ["key", "API_KEY", "apiKey", "x-app-key", "refreshToken", "otpCode"]) {
    assert(isSensitiveKey(sensitive), sensitive);
  }

  for (const innocent of ["keyword", "monkey", "tokenizer", "authored", "pinned", "id"]) {
    assert(!isSensitiveKey(innocent), innocent);
  }
});
