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
  DynamicLinkError,
  DynamicLinkKind,
  type DynamicLinkPayload,
} from "@scribe/host/dependencies/features/devops/dynamic-links/dynamic-links.ts";
import { DynamicLinkRepository } from "@scribe/host/dependencies/features/devops/dynamic-links/link/link.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import type { Row } from "@scribe/foundation/testing/database.ts";
import { installValkeryMock } from "@scribe/foundation/testing/valkery.ts";
import { assert, assertEquals } from "@std/assert";

const TABLE = "internal_t__dynamic_links";

const DEEPLINK: DynamicLinkPayload = {
  v: DYNAMIC_LINK_PAYLOAD_VERSION,
  kind: DynamicLinkKind.Deeplink,
  route: "brand",
  params: { id: "42" },
};

function row(overrides: Partial<Row> = {}): Row {
  return {
    short_link_id: 1,
    slug: crypto.randomUUID().replaceAll("-", "").slice(0, 10),
    payload: { ...DEEPLINK },
    expires_at: null,
    created_at: 1_000,
    updated_at: 1_000,
    ...overrides,
  };
}

function harness(rows: Row[] = []) {
  const kv = installValkeryMock();
  const database = installDatabaseMock({ [TABLE]: rows });

  return {
    database,
    links: new DynamicLinkRepository(),
    rows: () => database.rows(TABLE),
    restore() {
      database.restore();
      kv.restore();
    },
  };
}

Deno.test("get resolves a live link into a typed payload", async () => {
  const seed = row();
  const h = harness([seed]);

  try {
    const result = await h.links.get(seed.slug as string);

    assert(result.ok);
    assertEquals(result.data.slug, seed.slug);
    assertEquals(result.data.payload, DEEPLINK);
  } finally {
    h.restore();
  }
});

Deno.test("get answers not-found for an unknown slug", async () => {
  const h = harness([row()]);

  try {
    const result = await h.links.get("doesnotexist");

    assert(!result.ok);
    assertEquals(result.error, DynamicLinkError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("an expired link is refused as expired, not as missing", async () => {
  const seed = row({ expires_at: Date.now() - 1_000 });
  const h = harness([seed]);

  try {
    const result = await h.links.get(seed.slug as string);

    assert(!result.ok);
    assertEquals(result.error, DynamicLinkError.Expired);
  } finally {
    h.restore();
  }
});

Deno.test("a malformed payload looks like a missing link to get, and says so to getById", async () => {
  const seed = row({ payload: { v: 2, kind: "teleport" } });
  const h = harness([seed]);

  try {
    const bySlug = await h.links.get(seed.slug as string);
    const byId = await h.links.getById(1);

    assert(!bySlug.ok);
    assertEquals(
      bySlug.error,
      DynamicLinkError.NotFound,
      "the public path must not distinguish a corrupt row from an unknown slug",
    );
    assert(!byId.ok);
    assertEquals(byId.error, DynamicLinkError.MalformedPayload);
  } finally {
    h.restore();
  }
});

Deno.test("pagination returns the newest first and skips corrupt rows", async () => {
  const h = harness([
    row({ short_link_id: 1, created_at: 100 }),
    row({ short_link_id: 2, created_at: 300 }),
    row({ short_link_id: 3, created_at: 200, payload: { nonsense: true } }),
  ]);

  try {
    const result = await h.links.pagination();

    assert(result.ok);
    assertEquals(result.data.items.map((link) => link.id), [2, 1]);
  } finally {
    h.restore();
  }
});

Deno.test("add writes a row carrying a generated slug and the serialised payload", async () => {
  const h = harness();

  try {
    const result = await h.links.add({ payload: DEEPLINK });

    assert(result.ok);
    assertEquals(h.rows().length, 1);

    const written = h.rows()[0];
    assertEquals(written.payload, DEEPLINK);
    assertEquals(written.expires_at, null);
    assert(
      /^[0-9A-Za-z]{10}$/.test(written.slug as string),
      `"${written.slug}" must be a base62 slug`,
    );
  } finally {
    h.restore();
  }
});

Deno.test("add carries an explicit expiry through to the row", async () => {
  const h = harness();
  const expiresAt = Date.now() + 60_000;

  try {
    await h.links.add({ payload: DEEPLINK, expiresAt });

    assertEquals(h.rows()[0].expires_at, expiresAt);
  } finally {
    h.restore();
  }
});

Deno.test("update replaces the payload and drops the cached slug", async () => {
  const seed = row();
  const h = harness([seed]);
  const replacement: DynamicLinkPayload = {
    v: DYNAMIC_LINK_PAYLOAD_VERSION,
    kind: DynamicLinkKind.Redirect,
    url: "https://brand.test",
  };

  try {
    const before = await h.links.get(seed.slug as string);
    assert(before.ok);
    assertEquals(before.data.payload.kind, DynamicLinkKind.Deeplink);

    const updated = await h.links.update(1, { payload: replacement });
    assert(updated.ok);

    const after = await h.links.get(seed.slug as string);
    assert(after.ok);
    assertEquals(
      after.data.payload,
      replacement,
      "a stale cache entry would still answer with the old payload",
    );
  } finally {
    h.restore();
  }
});

Deno.test("update on an unknown id answers not-found and writes nothing", async () => {
  const seed = row();
  const h = harness([seed]);

  try {
    const result = await h.links.update(999, { expiresAt: 1 });

    assert(!result.ok);
    assertEquals(result.error, DynamicLinkError.NotFound);
    assertEquals(h.rows()[0].expires_at, null);
  } finally {
    h.restore();
  }
});

Deno.test("remove deletes the row and drops the cached slug", async () => {
  const seed = row();
  const h = harness([seed]);

  try {
    const before = await h.links.get(seed.slug as string);
    assert(before.ok);

    const removed = await h.links.remove(1);
    assert(removed.ok);
    assertEquals(h.rows().length, 0);

    const after = await h.links.get(seed.slug as string);
    assert(!after.ok);
    assertEquals(
      after.error,
      DynamicLinkError.NotFound,
      "a stale cache entry would keep serving a deleted link",
    );
  } finally {
    h.restore();
  }
});

Deno.test("remove on an unknown id answers not-found and keeps the row", async () => {
  const h = harness([row()]);

  try {
    const result = await h.links.remove(999);

    assert(!result.ok);
    assertEquals(result.error, DynamicLinkError.NotFound);
    assertEquals(h.rows().length, 1);
  } finally {
    h.restore();
  }
});

Deno.test("a legacy row is served as a v2 payload without being rewritten", async () => {
  const seed = row({
    payload: { v: 1, type: "brand_social", id: "42", network: "instagram", url: "https://instagram.com/brand" },
  });
  const h = harness([seed]);

  try {
    const result = await h.links.get(seed.slug as string);

    assert(result.ok);
    assertEquals(result.data.payload.kind, DynamicLinkKind.Redirect);
    assertEquals(
      h.rows()[0].payload,
      seed.payload,
      "reading must not migrate the stored row",
    );
  } finally {
    h.restore();
  }
});
