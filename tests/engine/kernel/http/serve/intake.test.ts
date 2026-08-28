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
import { type BodyIntake, readBoundedBody } from "@scribe/kernel/http/serve/body_reader.ts";
import { stripPrefix } from "@scribe/runtime/http/pathname.ts";
import { rewriteRequest } from "@scribe/kernel/http/serve/request_rewrite.ts";
import { admitBody, inflightBodyBytes, releaseBody } from "@scribe/kernel/http/serve/body_admission.ts";
import { MAX_BODY_BYTES, UNDECLARED_BODY_BYTES } from "@scribe/runtime/http/limits.ts";
import { httpSettings } from "@scribe/runtime/support/settings/http.ts";
import { assert, assertEquals } from "@std/assert";

function upload(contentLength: number | null): Request {
  const headers: Record<string, string> = {
    "content-type": "multipart/form-data; boundary=x",
  };
  if (contentLength !== null) {
    headers["content-length"] = String(contentLength);
  }

  return new Request("http://api.test/upload", { method: "POST", headers });
}

function jsonRequest(body: string): Request {
  return new Request("http://api.test/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function bodyOf(intake: BodyIntake): Uint8Array {
  assert(intake.ok, "the body was refused");
  return intake.bytes;
}

function textOf(intake: BodyIntake): string {
  return new TextDecoder().decode(bodyOf(intake));
}

Deno.test("readBoundedBody returns the whole body when it fits", async () => {
  assertEquals(textOf(await readBoundedBody(jsonRequest('{"a":1}'), MAX_BODY_BYTES)), '{"a":1}');
});

Deno.test("readBoundedBody reassembles a body split across chunks", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("hello "));
      controller.enqueue(new TextEncoder().encode("world"));
      controller.close();
    },
  });
  const req = new Request("http://api.test/", {
    method: "POST",
    body: stream,
  });

  assertEquals(textOf(await readBoundedBody(req, MAX_BODY_BYTES)), "hello world");
});

Deno.test("readBoundedBody refuses past the bound instead of buffering on", async () => {
  const intake = await readBoundedBody(jsonRequest("x".repeat(50)), 10);

  assertEquals(intake.ok, false);
  assertEquals(intake.ok ? null : intake.refusal, "too-large");
});

Deno.test("readBoundedBody fills the declared buffer once instead of copying twice", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("hello "));
      controller.enqueue(new TextEncoder().encode("world"));
      controller.close();
    },
  });
  const req = new Request("http://api.test/", { method: "POST", body: stream });

  assertEquals(textOf(await readBoundedBody(req, MAX_BODY_BYTES, 11)), "hello world");
});

Deno.test("readBoundedBody trims a body that came in under its declared length", async () => {
  const bytes = bodyOf(await readBoundedBody(jsonRequest('{"a":1}'), MAX_BODY_BYTES, 64));

  assertEquals(
    new TextDecoder().decode(bytes),
    '{"a":1}',
    "the preallocated tail must not be handed on as body bytes",
  );
  assertEquals(bytes.byteLength, 7);
});

Deno.test("readBoundedBody holds on to nothing more than the body that arrived", async () => {
  const declared = 8 * 1024 * 1024;

  const bytes = bodyOf(await readBoundedBody(jsonRequest('{"a":1}'), MAX_BODY_BYTES, declared));

  assertEquals(
    bytes.buffer.byteLength,
    bytes.byteLength,
    "a sub-view over the declared buffer pins the whole declaration for as long as the request lives: " +
      "seven bytes of body would hold eight megabytes",
  );
});

Deno.test("readBoundedBody keeps the single buffer when the body fills what it declared", async () => {
  const body = '{"a":1}';
  const bytes = bodyOf(await readBoundedBody(jsonRequest(body), MAX_BODY_BYTES, body.length));

  assertEquals(bytes.byteOffset, 0);
  assertEquals(bytes.buffer.byteLength, body.length, "an honest content-length must not cost a second copy");
});

Deno.test("readBoundedBody refuses a body that overruns what it declared", async () => {
  const intake = await readBoundedBody(jsonRequest("x".repeat(50)), MAX_BODY_BYTES, 10);

  assertEquals(
    intake.ok ? null : intake.refusal,
    "too-large",
    "a content-length that lies low bought a small reservation and must not outgrow it",
  );
});

Deno.test("readBoundedBody treats a body-less request as empty, not as an error", async () => {
  const req = new Request("http://api.test/", { method: "GET" });

  assertEquals(bodyOf(await readBoundedBody(req, MAX_BODY_BYTES)).byteLength, 0);
});

Deno.test("readBoundedBody tells a body that stopped mid-flight apart from one that was never sent", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"amount":10'));
      controller.error(new Error("connection reset"));
    },
  });
  const req = new Request("http://api.test/", { method: "POST", body: stream });

  const intake = await readBoundedBody(req, MAX_BODY_BYTES);

  assertEquals(
    intake.ok ? null : intake.refusal,
    "unreadable",
    "half a body read as a whole one is how a dropped connection turns into an accepted write",
  );
});

Deno.test("admitBody charges a non-multipart request to the in-flight budget too", () => {
  const admission = admitBody(jsonRequest("{}"));
  try {
    assert(admission);
    assertEquals(
      admission.reservedBytes,
      admission.maxBodyBytes,
      "a body admitted for free is a body nothing bounds: a thousand of them is what takes the process past its container",
    );
    assertEquals(admission.maxBodyBytes, UNDECLARED_BODY_BYTES);
    assertEquals(admission.declaredBytes, null, "the fetch Request declared no length");
  } finally {
    if (admission) releaseBody(admission);
  }

  assertEquals(inflightBodyBytes(), 0);
});

Deno.test("admitBody holds a non-multipart request to its own declared length", () => {
  const req = new Request("http://api.test/", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "512" },
    body: "{}",
  });

  const admission = admitBody(req);
  try {
    assertEquals(admission?.reservedBytes, 512);
    assertEquals(admission?.maxBodyBytes, 512);
    assertEquals(admission?.declaredBytes, 512);
  } finally {
    if (admission) releaseBody(admission);
  }
});

Deno.test("admitBody refuses an over-declared length and falls back on the undeclared size", () => {
  const req = new Request("http://api.test/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(MAX_BODY_BYTES + 1),
    },
    body: "{}",
  });

  const admission = admitBody(req);
  try {
    assertEquals(admission?.maxBodyBytes, UNDECLARED_BODY_BYTES);
    assertEquals(admission?.declaredBytes, null, "an unusable length is no length at all");
  } finally {
    if (admission) releaseBody(admission);
  }
});

Deno.test("admitBody reserves exactly what it will let itself buffer", () => {
  const admission = admitBody(upload(1_000));
  try {
    assertEquals(
      admission?.reservedBytes,
      admission?.maxBodyBytes,
      "reserving less than the read bound is what lets a lying content-length exhaust memory",
    );
    assertEquals(admission?.reservedBytes, 1_000);
  } finally {
    if (admission) releaseBody(admission);
  }
});

Deno.test("admitBody reserves the undeclared size when the length is missing or unusable", () => {
  for (const declared of [null, 0, -1, MAX_BODY_BYTES + 1]) {
    const admission = admitBody(upload(declared));
    try {
      assertEquals(admission?.reservedBytes, UNDECLARED_BODY_BYTES);
      assertEquals(admission?.maxBodyBytes, UNDECLARED_BODY_BYTES);
      assertEquals(admission?.declaredBytes, null);
    } finally {
      if (admission) releaseBody(admission);
    }
  }
});

Deno.test("admitBody refuses once the in-flight budget is spent, and frees it back", () => {
  const held = [];
  try {
    for (let i = 0; i < 2; i++) {
      const admission = admitBody(upload(MAX_BODY_BYTES));
      assert(admission, `upload ${i} fits in the 256 MB budget`);
      held.push(admission);
    }

    assertEquals(
      admitBody(upload(MAX_BODY_BYTES)),
      null,
      "a third 100 MB upload would take the budget past 256 MB",
    );
  } finally {
    for (const admission of held) releaseBody(admission);
  }

  assertEquals(inflightBodyBytes(), 0, "releasing must return the budget");
});

Deno.test("admitBody spends the budget the deployment configured, not a compiled-in one", () => {
  const configured = httpSettings.get();
  httpSettings.use({ ...configured, maxInflightBodyBytes: MAX_BODY_BYTES });

  try {
    const first = admitBody(upload(MAX_BODY_BYTES));
    try {
      assert(first, "one upload is exactly the budget a 100 MB replica was given");
      assertEquals(
        admitBody(upload(MAX_BODY_BYTES)),
        null,
        "a replica sized under the old 256 MB ceiling must refuse the second upload",
      );
    } finally {
      if (first) releaseBody(first);
    }
  } finally {
    httpSettings.use(configured);
  }

  assertEquals(inflightBodyBytes(), 0);
});

Deno.test("stripPrefix removes the service segment and nothing else", () => {
  assertEquals(stripPrefix("/queue/drain", "queue"), "/drain");
  assertEquals(stripPrefix("/queue", "queue"), "/");
  assertEquals(stripPrefix("/other/drain", "queue"), "/other/drain");
  assertEquals(stripPrefix("/queued/drain", "queue"), "/queued/drain");
});

Deno.test("rewriteRequest carries the body bytes across the rewrite", async () => {
  const bodyBytes = new TextEncoder().encode('{"kept":true}');
  const original = new Request("http://api.test/queue/drain", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });

  const rewritten = rewriteRequest(original, bodyBytes, "/drain");

  assertEquals(new URL(rewritten.url).pathname, "/drain");
  assertEquals(await rewritten.text(), '{"kept":true}');
});

Deno.test("rewriteRequest keeps the query string the surface prefix hid", () => {
  const rewritten = rewriteRequest(
    new Request("http://api.test/admin/team/roles?offset=40&size=10"),
    null,
    "/team/roles",
  );

  const url = new URL(rewritten.url);
  assertEquals(url.pathname, "/team/roles");
  assertEquals(url.searchParams.get("offset"), "40");
  assertEquals(url.searchParams.get("size"), "10");
});

Deno.test("rewriteRequest adds no query string when the request carried none", () => {
  const rewritten = rewriteRequest(
    new Request("http://api.test/admin/team/roles"),
    null,
    "/team/roles",
  );

  assertEquals(rewritten.url, "http://api.test/team/roles");
});

Deno.test("rewriteRequest sends only the view, not the buffer behind it", async () => {
  const backing = new TextEncoder().encode('PADDING{"kept":true}');
  const view = backing.subarray(7);

  const rewritten = rewriteRequest(
    new Request("http://api.test/x", { method: "POST" }),
    view,
    "/x",
  );

  assertEquals(await rewritten.text(), '{"kept":true}');
});

Deno.test("rewriteRequest drops the body on a method that cannot carry one", () => {
  const rewritten = rewriteRequest(
    new Request("http://api.test/queue/status", { method: "GET" }),
    new TextEncoder().encode("ignored"),
    "/status",
  );

  assertEquals(rewritten.body, null);
});
