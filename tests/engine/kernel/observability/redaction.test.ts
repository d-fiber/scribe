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

import { previewOf } from "@scribe/kernel/observability/body_preview.ts";
import { isSensitiveKey, redactIfJson, redactSensitive } from "@scribe/kernel/observability/redaction.ts";
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

Deno.test("previewOf stops reading a streamed body instead of holding all of it", async () => {
  const megabytes = 4;
  const stream = new ReadableStream({
    start(controller) {
      for (let chunk = 0; chunk < megabytes; chunk++) {
        controller.enqueue(new Uint8Array(1024 * 1024).fill(120));
      }
      controller.close();
    },
  });

  const preview = await previewOf(new Response(stream, { status: 502 }));

  assertStringIncludes(
    preview,
    "bytes",
    "a chunked error page declares no length: reading it whole is megabytes held on the request path",
  );
  assert(preview.length < 100, "the size is what travels, not a prefix cut mid-object");
});

Deno.test("previewOf leaves the response readable by the caller, streamed or not", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"code":"conflict"}'));
      controller.close();
    },
  });
  const response = new Response(stream, { status: 409 });

  await previewOf(response);

  assertEquals(await response.json(), { code: "conflict" });
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
