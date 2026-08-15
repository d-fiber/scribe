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

import { readBoundedBody } from "@scribe/core/kernel/http/serve/body_reader.ts";
import { rewriteRequest, stripPrefix } from "@scribe/core/kernel/http/serve/request_rewrite.ts";
import {
  admitUpload,
  inflightUploadBytes,
  releaseUpload,
} from "@scribe/core/kernel/http/serve/upload_admission.ts";
import { MAX_BODY_BYTES, MAX_FORM_BYTES } from "@scribe/core/runtime/http/limits.ts";
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

Deno.test("readBoundedBody returns the whole body when it fits", async () => {
  const bytes = await readBoundedBody(jsonRequest('{"a":1}'), MAX_BODY_BYTES);

  assertEquals(new TextDecoder().decode(bytes!), '{"a":1}');
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

  const bytes = await readBoundedBody(req, MAX_BODY_BYTES);

  assertEquals(new TextDecoder().decode(bytes!), "hello world");
});

Deno.test("readBoundedBody yields null past the bound instead of buffering on", async () => {
  assertEquals(await readBoundedBody(jsonRequest("x".repeat(50)), 10), null);
});

Deno.test("readBoundedBody treats a body-less request as empty, not as an error", async () => {
  const req = new Request("http://api.test/", { method: "GET" });

  assertEquals((await readBoundedBody(req, MAX_BODY_BYTES))?.byteLength, 0);
});

Deno.test("admitUpload leaves a non-multipart request on the json bound", () => {
  const admission = admitUpload(jsonRequest("{}"));

  assertEquals(admission?.reservedBytes, 0);
  assertEquals(admission?.maxBodyBytes, MAX_BODY_BYTES);
});

Deno.test("admitUpload reserves exactly what it will let itself buffer", () => {
  const admission = admitUpload(upload(1_000));
  try {
    assertEquals(
      admission?.reservedBytes,
      admission?.maxBodyBytes,
      "reserving less than the read bound is what lets a lying content-length exhaust memory",
    );
    assertEquals(admission?.reservedBytes, 1_000);
  } finally {
    if (admission) releaseUpload(admission);
  }
});

Deno.test("admitUpload falls back to the form ceiling without a usable length", () => {
  for (const declared of [null, 0, -1, MAX_FORM_BYTES + 1]) {
    const admission = admitUpload(upload(declared));
    try {
      assertEquals(admission?.reservedBytes, MAX_FORM_BYTES);
      assertEquals(admission?.maxBodyBytes, MAX_FORM_BYTES);
    } finally {
      if (admission) releaseUpload(admission);
    }
  }
});

Deno.test("admitUpload refuses once the in-flight budget is spent, and frees it back", () => {
  const held = [];
  try {
    for (let i = 0; i < 2; i++) {
      const admission = admitUpload(upload(null));
      assert(admission, `upload ${i} fits in the 256 MB budget`);
      held.push(admission);
    }

    assertEquals(
      admitUpload(upload(null)),
      null,
      "a third 100 MB upload would take the budget past 256 MB",
    );
  } finally {
    for (const admission of held) releaseUpload(admission);
  }

  assertEquals(inflightUploadBytes(), 0, "releasing must return the budget");
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

Deno.test("rewriteRequest sends only the view, not the buffer behind it", async () => {
  const backing = new TextEncoder().encode("PADDING{\"kept\":true}");
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
