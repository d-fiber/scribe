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

import {
  DYNAMIC_LINK_PAYLOAD_VERSION,
  DynamicLinkKind,
  isSafeRedirectUrl,
  parseDynamicLinkPayload,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("a v2 deeplink round-trips untouched", () => {
  const payload = parseDynamicLinkPayload({
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Deeplink,
    route: "brand/detail",
    params: { id: "42" },
  });

  assertEquals(payload, {
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Deeplink,
    route: "brand/detail",
    params: { id: "42" },
  });
});

Deno.test("a legacy deeplink becomes a route plus its scalar fields", () => {
  const payload = parseDynamicLinkPayload({ v: 1, type: "brand", id: "42" });

  assertEquals(payload, {
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Deeplink,
    route: "brand",
    params: { id: "42" },
  });
});

Deno.test("a legacy social link becomes a redirection keeping its context", () => {
  const payload = parseDynamicLinkPayload({
    v: 1,
    type: "brand_social",
    id: "42",
    network: "instagram",
    url: "https://instagram.com/brand",
  });

  assertEquals(payload, {
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Redirect,
    url: "https://instagram.com/brand",
    meta: { id: "42", network: "instagram", type: "brand_social" },
  });
});

Deno.test("a legacy payload is read by its url, not by its type", () => {
  const withUrl = parseDynamicLinkPayload({
    v: 1,
    type: "brand_website",
    id: "42",
    url: "https://brand.test",
  });
  const withoutUrl = parseDynamicLinkPayload({
    v: 1,
    type: "brand_website",
    id: "42",
  });

  assertEquals(withUrl?.kind, DynamicLinkKind.Redirect);
  assertEquals(withoutUrl?.kind, DynamicLinkKind.Deeplink);
});

Deno.test("a redirection to a non-http scheme is refused, not sanitised", () => {
  const cases = [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "not a url",
  ];

  for (const url of cases) {
    assert(!isSafeRedirectUrl(url), `${url} must not be a safe redirect`);
    assertEquals(
      parseDynamicLinkPayload({
        v: DYNAMIC_LINK_PAYLOAD_VERSION,
        kind: DynamicLinkKind.Redirect,
        url,
      }),
      null,
      `${url} must not survive parsing`,
    );
  }
});

Deno.test("a route that is not a plain path segment is refused", () => {
  const cases = ["../admin", "brand?x=1", "brand detail", "/brand", ""];

  for (const route of cases) {
    assertEquals(
      parseDynamicLinkPayload({
        v: DYNAMIC_LINK_PAYLOAD_VERSION,
        kind: DynamicLinkKind.Deeplink,
        route,
      }),
      null,
      `"${route}" must not survive parsing`,
    );
  }
});

Deno.test("a preview keeps its title and drops an unsafe image", () => {
  const payload = parseDynamicLinkPayload({
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Redirect,
    url: "https://brand.test",
    preview: {
      title: "Brand",
      description: "A description",
      imageUrl: "javascript:alert(1)",
    },
  });

  assertEquals(payload?.preview, { title: "Brand", description: "A description" });
});

Deno.test("a preview without a title is dropped entirely", () => {
  const payload = parseDynamicLinkPayload({
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Redirect,
    url: "https://brand.test",
    preview: { description: "orphan" },
  });

  assertEquals(payload?.preview, undefined);
});

Deno.test("non-string params and meta entries are dropped", () => {
  const payload = parseDynamicLinkPayload({
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Deeplink,
    route: "brand",
    params: { id: "42", count: 3, nested: { a: 1 } },
    meta: { entity: "brand", flag: true },
  });

  assert(payload?.kind === DynamicLinkKind.Deeplink);
  assertEquals(payload.params, { id: "42" });
  assertEquals(payload.meta, { entity: "brand" });
});

Deno.test("anything unreadable yields null rather than a half-built payload", () => {
  const cases: unknown[] = [
    null,
    undefined,
    "a string",
    42,
    [],
    {},
    { v: 2, kind: "teleport", url: "https://brand.test" },
    { v: 1 },
  ];

  for (const raw of cases) {
    assertEquals(
      parseDynamicLinkPayload(raw),
      null,
      `${JSON.stringify(raw)} must not parse`,
    );
  }
});
