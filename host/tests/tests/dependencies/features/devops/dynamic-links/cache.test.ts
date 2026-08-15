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
  type DynamicLink,
  DynamicLinkKind,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { dynamicLinkCache } from "@scribe/host/dependencies/features/devops/dynamic-links/link/_cache.ts";
import { installValkeryMock } from "@scribe/core/testing/runtime/redis.ts";
import { assertEquals } from "@std/assert";

function link(slug: string, expiresAt: number | null = null): DynamicLink {
  return {
    id: 1,
    slug,
    payload: {
      v: DYNAMIC_LINK_PAYLOAD_VERSION,
      kind: DynamicLinkKind.Deeplink,
      route: "brand",
      params: { id: "42" },
    },
    expiresAt,
    createdAt: 0,
    updatedAt: 0,
  };
}

function counted(result: DynamicLink | null) {
  let calls = 0;
  return {
    calls: () => calls,
    load: () => {
      calls++;
      return Promise.resolve(result);
    },
  };
}

Deno.test("a resolved slug is loaded once, then served from the cache", async () => {
  const kv = installValkeryMock();
  const slug = crypto.randomUUID().slice(0, 10);
  const loader = counted(link(slug));

  try {
    const first = await dynamicLinkCache.read(slug, loader.load);
    const second = await dynamicLinkCache.read(slug, loader.load);

    assertEquals(loader.calls(), 1);
    assertEquals(first?.slug, slug);
    assertEquals(second?.slug, slug);
  } finally {
    kv.restore();
  }
});

Deno.test("an unknown slug is cached too, so scanning stays cheap for us", async () => {
  const kv = installValkeryMock();
  const slug = crypto.randomUUID().slice(0, 10);
  const loader = counted(null);

  try {
    assertEquals(await dynamicLinkCache.read(slug, loader.load), null);
    assertEquals(await dynamicLinkCache.read(slug, loader.load), null);

    assertEquals(
      loader.calls(),
      1,
      "a miss must be remembered, not replayed against the database",
    );
  } finally {
    kv.restore();
  }
});

Deno.test("forgetting a slug sends the next read back to the loader", async () => {
  const kv = installValkeryMock();
  const slug = crypto.randomUUID().slice(0, 10);
  const loader = counted(link(slug));

  try {
    await dynamicLinkCache.read(slug, loader.load);
    await dynamicLinkCache.forget(slug);
    await dynamicLinkCache.read(slug, loader.load);

    assertEquals(loader.calls(), 2);
  } finally {
    kv.restore();
  }
});

Deno.test("two slugs never share a cache entry", async () => {
  const kv = installValkeryMock();
  const first = crypto.randomUUID().slice(0, 10);
  const second = crypto.randomUUID().slice(0, 10);

  try {
    await dynamicLinkCache.read(first, () => Promise.resolve(link(first)));
    const other = await dynamicLinkCache.read(
      second,
      () => Promise.resolve(link(second)),
    );

    assertEquals(other?.slug, second);
  } finally {
    kv.restore();
  }
});

Deno.test("expiry is not baked into the cached value", async () => {
  const kv = installValkeryMock();
  const slug = crypto.randomUUID().slice(0, 10);
  const expired = Date.now() - 1_000;

  try {
    await dynamicLinkCache.read(slug, () => Promise.resolve(link(slug, expired)));
    const cached = await dynamicLinkCache.read(
      slug,
      () => Promise.reject(new Error("must not reload")),
    );

    assertEquals(
      cached?.expiresAt,
      expired,
      "the caller re-reads expiresAt on every hit, so it must survive the round trip",
    );
  } finally {
    kv.restore();
  }
});
