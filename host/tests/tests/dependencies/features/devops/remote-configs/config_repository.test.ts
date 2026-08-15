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

import { RemoteConfigRepository } from "@scribe/host/dependencies/features/devops/remote-configs/config/config.ts";
import { RemoteConfigError } from "@scribe/host/dependencies/features/devops/remote-configs/remote-configs.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { assert, assertEquals } from "@std/assert";

const TABLE = "internal_t__remote_configs";
const RPC = "visible_remote_config_audiences";

// Mirrors visible_remote_config_audiences() so the test fails if the SQL rule
// and the client ever stop agreeing on who sees what.
const AUDIENCES: Record<string, string[]> = {
  user: ["public", "authenticated", "user"],
  admin: ["public", "authenticated", "admin"],
};

function config(overrides: Partial<Row> = {}): Row {
  return {
    remote_config_id: 1,
    key: "feature.flags",
    value: { enabled: true },
    audience: "public",
    description: null,
    is_active: true,
    hash: "hash-1",
    created_at: 1_000,
    updated_at: 2_000,
    ...overrides,
  };
}

function harness(rows: Row[]) {
  const rest = installRestMock({ [TABLE]: rows });
  rest.onRpc(RPC, (args) => {
    const caller = args?.p_caller_type as string | null;
    return caller ? AUDIENCES[caller] ?? ["public"] : ["public"];
  });

  return {
    configs: new RemoteConfigRepository(),
    rows: (): Row[] => rest.rows(TABLE),
    restore: () => rest.restore(),
  };
}

Deno.test("get returns the config with the hash the trigger stored", async () => {
  const h = harness([config({ hash: "abc123" })]);

  try {
    const result = await h.configs.get("feature.flags");

    assert(result.ok);
    assertEquals(result.data.hash, "abc123");
    assertEquals(result.data.value, { enabled: true });
  } finally {
    h.restore();
  }
});

Deno.test("get is the management read: it serves a disabled config as-is", async () => {
  const h = harness([config({ is_active: false })]);

  try {
    const result = await h.configs.get("feature.flags");

    assert(result.ok);
    assertEquals(
      result.data.isActive,
      false,
      "an admin has to see a disabled config to be able to re-enable it",
    );
  } finally {
    h.restore();
  }
});

Deno.test("update patches by key and leaves the untouched fields alone", async () => {
  const h = harness([config({ description: "before" })]);

  try {
    const result = await h.configs.update("feature.flags", { isActive: false });

    assert(result.ok);
    const row = h.rows()[0];
    assertEquals(row.is_active, false);
    assertEquals(row.description, "before");
  } finally {
    h.restore();
  }
});

Deno.test("update and remove answer not-found on an unknown key", async () => {
  const h = harness([config()]);

  try {
    const updated = await h.configs.update("nope", { isActive: false });
    const removed = await h.configs.remove("nope");

    assert(!updated.ok);
    assert(!removed.ok);
    assertEquals(updated.error, RemoteConfigError.NotFound);
    assertEquals(removed.error, RemoteConfigError.NotFound);
    assertEquals(h.rows().length, 1);
  } finally {
    h.restore();
  }
});

Deno.test("remove deletes by key", async () => {
  const h = harness([config()]);

  try {
    const result = await h.configs.remove("feature.flags");

    assert(result.ok);
    assertEquals(h.rows().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("resolveKey is the consumption read: a disabled config is refused", async () => {
  const h = harness([config({ is_active: false })]);

  try {
    const result = await h.configs.resolveKey("feature.flags", "user");

    assert(!result.ok);
    assertEquals(
      result.error,
      RemoteConfigError.Inactive,
      "a disabled config must be distinguishable from a typo in the key",
    );
  } finally {
    h.restore();
  }
});

Deno.test("get answers not-found on an unknown key", async () => {
  const h = harness([config()]);

  try {
    const result = await h.configs.get("nope");

    assert(!result.ok);
    assertEquals(result.error, RemoteConfigError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("resolveKey serves a config whose audience the caller may read", async () => {
  const h = harness([config({ audience: "user" })]);

  try {
    const result = await h.configs.resolveKey("feature.flags", "user");

    assert(result.ok);
    assertEquals(result.data.audience, "user");
  } finally {
    h.restore();
  }
});

Deno.test("resolveKey hides a config the caller may not read, without leaking that it exists", async () => {
  const h = harness([config({ audience: "admin" })]);

  try {
    const anonymous = await h.configs.resolveKey("feature.flags", null);
    const user = await h.configs.resolveKey("feature.flags", "user");

    assert(!anonymous.ok);
    assert(!user.ok);
    assertEquals(anonymous.error, RemoteConfigError.NotFound);
    assertEquals(
      user.error,
      RemoteConfigError.NotFound,
      "answering `inactive` or anything else would confirm the key exists",
    );
  } finally {
    h.restore();
  }
});

Deno.test("resolveKey reports inactive only once the caller was allowed to see it", async () => {
  const h = harness([config({ audience: "authenticated", is_active: false })]);

  try {
    const user = await h.configs.resolveKey("feature.flags", "user");
    const anonymous = await h.configs.resolveKey("feature.flags", null);

    assert(!user.ok);
    assertEquals(user.error, RemoteConfigError.Inactive);
    assert(!anonymous.ok);
    assertEquals(anonymous.error, RemoteConfigError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("an anonymous caller only ever resolves public configs", async () => {
  const h = harness([
    config({ remote_config_id: 1, key: "a", audience: "public" }),
    config({ remote_config_id: 2, key: "b", audience: "authenticated" }),
    config({ remote_config_id: 3, key: "c", audience: "admin" }),
  ]);

  try {
    const result = await h.configs.resolveVisible(null);

    assert(result.ok);
    assertEquals(result.data.map((item) => item.key), ["a"]);
  } finally {
    h.restore();
  }
});

Deno.test("resolveVisible drops the disabled configs", async () => {
  const h = harness([
    config({ remote_config_id: 1, key: "a", audience: "public" }),
    config({ remote_config_id: 2, key: "b", audience: "public", is_active: false }),
  ]);

  try {
    const result = await h.configs.resolveVisible("user");

    assert(result.ok);
    assertEquals(result.data.map((item) => item.key), ["a"]);
  } finally {
    h.restore();
  }
});

Deno.test("a user and an admin each see their own audience, both see authenticated", async () => {
  const rows = [
    config({ remote_config_id: 1, key: "pub", audience: "public" }),
    config({ remote_config_id: 2, key: "auth", audience: "authenticated" }),
    config({ remote_config_id: 3, key: "usr", audience: "user" }),
    config({ remote_config_id: 4, key: "adm", audience: "admin" }),
  ];
  const h = harness(rows);

  try {
    const user = await h.configs.resolveVisible("user");
    const admin = await h.configs.resolveVisible("admin");

    assert(user.ok);
    assert(admin.ok);
    assertEquals(user.data.map((item) => item.key).sort(), ["auth", "pub", "usr"]);
    assertEquals(admin.data.map((item) => item.key).sort(), ["adm", "auth", "pub"]);
  } finally {
    h.restore();
  }
});
