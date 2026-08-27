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

import { importSigningKey, matchesAnyCandidate } from "@scribe/kernel/endpoint/webhook/signature.ts";
import {
  isFreshTimestamp,
  MAX_SIGNATURE_CANDIDATES,
  MAX_TIMESTAMP_SKEW_S,
  readSignedRequest,
  type SignedWebhookRequest,
} from "@scribe/kernel/endpoint/webhook/signed_request.ts";
import "@scribe/testing/settings.ts";
import { CLAIM_TTL_S, claimWebhookId } from "@scribe/kernel/endpoint/webhook/replay.ts";
import { kv } from "@scribe/foundation/redis";
import type { Kv } from "@scribe/foundation/redis";
import { RequestScope } from "@scribe/runtime/scope.ts";
import { assert, assertEquals, assertFalse } from "@std/assert";
import { stub } from "@std/testing/mock";

const SECRET_BYTES = new Uint8Array(32).fill(7);
const SECRET = `whsec_${btoa(String.fromCharCode(...SECRET_BYTES))}`;

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function sign(signed: SignedWebhookRequest): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    SECRET_BYTES,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(
      `${signed.id}.${signed.timestamp}.${signed.rawBody}`,
    ),
  );
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

function withHeaders<T>(
  headers: Record<string, string>,
  body: string,
  run: () => T,
): T {
  const req = new Request("http://api.test/hook", {
    method: "POST",
    headers,
    body,
  });
  return RequestScope.run(req, new TextEncoder().encode(body), run, "127.0.0.1");
}

Deno.test("readSignedRequest keeps only the signature part of each entry", () => {
  const signed = withHeaders(
    {
      "webhook-id": "msg_1",
      "webhook-timestamp": "1700000000",
      "webhook-signature": "v1,AAAA v1,BBBB",
    },
    "{}",
    readSignedRequest,
  );

  assertEquals(signed?.candidateSignatures, ["AAAA", "BBBB"]);
  assertEquals(signed?.rawBody, "{}");
});

Deno.test("readSignedRequest refuses a delivery missing any of the three headers", () => {
  const complete = {
    "webhook-id": "msg_1",
    "webhook-timestamp": "1700000000",
    "webhook-signature": "v1,AAAA",
  };

  for (const missing of Object.keys(complete)) {
    const headers = { ...complete } as Record<string, string>;
    delete headers[missing];

    assertEquals(
      withHeaders(headers, "{}", readSignedRequest),
      null,
      `without ${missing} there is nothing to verify`,
    );
  }
});

Deno.test("readSignedRequest refuses a signature header carrying no signature", () => {
  assertEquals(
    withHeaders(
      {
        "webhook-id": "msg_1",
        "webhook-timestamp": "1700000000",
        "webhook-signature": "v1",
      },
      "{}",
      readSignedRequest,
    ),
    null,
  );
});

Deno.test("readSignedRequest refuses a header offering more signatures than a rotation needs", () => {
  const many = Array.from({ length: MAX_SIGNATURE_CANDIDATES + 1 }, (_, at) => `v1,AAAA${at}`).join(" ");

  assertEquals(
    withHeaders(
      {
        "webhook-id": "msg_1",
        "webhook-timestamp": "1700000000",
        "webhook-signature": many,
      },
      "{}",
      readSignedRequest,
    ),
    null,
    "every candidate costs an HMAC over a body the sender chose, so the header cannot set how many",
  );
});

Deno.test("readSignedRequest still takes as many signatures as a rotation needs", () => {
  const rotation = Array.from({ length: MAX_SIGNATURE_CANDIDATES }, (_, at) => `v1,AAAA${at}`).join(" ");

  assertEquals(
    withHeaders(
      {
        "webhook-id": "msg_1",
        "webhook-timestamp": "1700000000",
        "webhook-signature": rotation,
      },
      "{}",
      readSignedRequest,
    )?.candidateSignatures.length,
    MAX_SIGNATURE_CANDIDATES,
  );
});

Deno.test("isFreshTimestamp accepts the window and refuses either side of it", () => {
  assert(isFreshTimestamp(String(nowSeconds())));
  assert(isFreshTimestamp(String(nowSeconds() - MAX_TIMESTAMP_SKEW_S + 5)));
  assertFalse(isFreshTimestamp(String(nowSeconds() - MAX_TIMESTAMP_SKEW_S - 5)));
  assertFalse(isFreshTimestamp(String(nowSeconds() + MAX_TIMESTAMP_SKEW_S + 5)));
});

Deno.test("isFreshTimestamp refuses what is not a number", () => {
  for (const bad of ["", "soon", "NaN", "Infinity"]) {
    assertFalse(isFreshTimestamp(bad), `"${bad}" is not a timestamp`);
  }
});

Deno.test("importSigningKey refuses a secret without its whsec_ prefix", async () => {
  assertEquals(await importSigningKey("nope"), null);
  assertEquals(await importSigningKey(""), null);
});

Deno.test("matchesAnyCandidate accepts a genuine signature among decoys", async () => {
  const signed: SignedWebhookRequest = {
    id: "msg_1",
    timestamp: String(nowSeconds()),
    candidateSignatures: [],
    rawBody: '{"ok":true}',
  };
  const genuine = await sign(signed);
  const key = await importSigningKey(SECRET);
  assert(key);

  assert(
    await matchesAnyCandidate(key, {
      ...signed,
      candidateSignatures: ["AAAA", genuine],
    }),
  );
});

Deno.test("matchesAnyCandidate refuses a signature computed on another body", async () => {
  const timestamp = String(nowSeconds());
  const genuine = await sign({
    id: "msg_1",
    timestamp,
    candidateSignatures: [],
    rawBody: '{"ok":true}',
  });
  const key = await importSigningKey(SECRET);
  assert(key);

  assertFalse(
    await matchesAnyCandidate(key, {
      id: "msg_1",
      timestamp,
      candidateSignatures: [genuine],
      rawBody: '{"ok":false}',
    }),
    "the body is part of the signed message",
  );
});

Deno.test("matchesAnyCandidate skips an unreadable candidate instead of throwing", async () => {
  const key = await importSigningKey(SECRET);
  assert(key);

  assertFalse(
    await matchesAnyCandidate(key, {
      id: "msg_1",
      timestamp: String(nowSeconds()),
      candidateSignatures: ["!!! not base64 !!!"],
      rawBody: "{}",
    }),
  );
});

Deno.test("the replay claim outlives every timestamp the freshness check accepts", async () => {
  const seen: number[] = [];
  const kvSet = stub(
    kv(),
    "set",
    ((_key: string, _value: string, _mode: string, ttl: number) => {
      seen.push(ttl);
      return Promise.resolve("OK" as const);
    }) as unknown as Kv["set"],
  );

  try {
    assert(await claimWebhookId("msg_replay"));
  } finally {
    kvSet.restore();
  }

  assertEquals(seen, [CLAIM_TTL_S]);
  assert(
    CLAIM_TTL_S >= 2 * MAX_TIMESTAMP_SKEW_S,
    "a delivery timestamped MAX_TIMESTAMP_SKEW_S in the future is accepted now " +
      "and still accepted MAX_TIMESTAMP_SKEW_S from now, so a claim that only " +
      "lives one skew leaves the tail of that window unprotected",
  );
});

Deno.test("a future-dated delivery stays claimed for as long as it stays fresh", () => {
  const signedAt = nowSeconds() + MAX_TIMESTAMP_SKEW_S;
  const firstDeliveryAt = nowSeconds();
  const lastFreshAt = signedAt + MAX_TIMESTAMP_SKEW_S;

  assert(
    isFreshTimestamp(String(signedAt)),
    "the freshness check accepts a timestamp a full skew in the future",
  );
  assert(
    firstDeliveryAt + CLAIM_TTL_S >= lastFreshAt,
    "the claim must still exist when the last acceptable replay arrives",
  );
});
