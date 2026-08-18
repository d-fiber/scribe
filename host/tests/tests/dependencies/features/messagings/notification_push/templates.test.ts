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
  PushNotificationOpenError,
  PushNotificationOpenRepository,
  PushTemplateError,
  PushTemplateRepository,
} from "@scribe/host/dependencies/features/messagings/notification_push/push.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { assert, assertEquals } from "@std/assert";

function templates(): Row[] {
  return [
    {
      push_template_id: 1,
      name: "welcome",
      title: "Bienvenue",
      body: "Découvre les bons plans",
      data: { type: "welcome" },
    },
    {
      push_template_id: 2,
      name: "reminder",
      title: "Rappel",
      body: "Tu as des offres en attente",
      data: null,
    },
  ];
}

function opens(): Row[] {
  return [
    { open_id: 100, push_id: 1, created_at: 10 },
    { open_id: 101, push_id: 1, created_at: 20 },
    { open_id: 102, push_id: 2, created_at: 30 },
  ];
}

function harness() {
  const database = installDatabaseMock({
    internal_t__push_templates: templates(),
    internal_t__notification_push_opens: opens(),
  });

  return {
    database,
    templates: new PushTemplateRepository(),
    opens: new PushNotificationOpenRepository(),
  };
}

// --- templates ---------------------------------------------------------------

Deno.test("templates.getByName: resolves the name in_app_notifications.type carries", async () => {
  const h = harness();
  try {
    const result = await h.templates.getByName("welcome");
    assert(result.ok);
    assertEquals(result.data.id, 1);
    assertEquals(result.data.title, "Bienvenue");
  } finally {
    h.database.restore();
  }
});

Deno.test("templates.getByName: an unknown name is NotFound", async () => {
  const h = harness();
  try {
    const result = await h.templates.getByName("nope");
    assert(!result.ok);
    assertEquals(result.error, PushTemplateError.NotFound);
  } finally {
    h.database.restore();
  }
});

Deno.test("templates.getById: an unknown id is NotFound", async () => {
  const h = harness();
  try {
    const result = await h.templates.getById(404);
    assert(!result.ok);
    assertEquals(result.error, PushTemplateError.NotFound);
  } finally {
    h.database.restore();
  }
});

Deno.test("templates.create: data defaults to null rather than being omitted", async () => {
  const h = harness();
  try {
    const result = await h.templates.create({
      name: "promo",
      title: "Promo",
      body: "Body",
    });

    assert(result.ok);
    assertEquals(result.data.data, null);
    assertEquals(h.database.rows("internal_t__push_templates").length, 3);
  } finally {
    h.database.restore();
  }
});

Deno.test("templates.update: an unknown id is NotFound, not a silent OK", async () => {
  const h = harness();
  try {
    const result = await h.templates.update(404, { title: "changed" });

    assert(!result.ok);
    assertEquals(result.error, PushTemplateError.NotFound);
  } finally {
    h.database.restore();
  }
});

Deno.test("templates.update: writes only the given fields", async () => {
  const h = harness();
  try {
    const result = await h.templates.update(1, { title: "changed" });
    assert(result.ok);

    const row = h.database
      .rows("internal_t__push_templates")
      .find((r) => r.push_template_id === 1);
    assertEquals(row?.title, "changed");
    assertEquals(row?.body, "Découvre les bons plans", "untouched fields survive");
  } finally {
    h.database.restore();
  }
});

Deno.test("templates.remove: an unknown id is NotFound, not a silent OK", async () => {
  const h = harness();
  try {
    const missing = await h.templates.remove(404);
    assert(!missing.ok);
    assertEquals(missing.error, PushTemplateError.NotFound);
    assertEquals(h.database.rows("internal_t__push_templates").length, 2);

    const removed = await h.templates.remove(1);
    assert(removed.ok);
    assertEquals(h.database.rows("internal_t__push_templates").length, 1);
  } finally {
    h.database.restore();
  }
});

// --- opens -------------------------------------------------------------------

Deno.test("opens.list: only the opens of that push", async () => {
  const h = harness();
  try {
    const result = await h.opens.list(1);
    assert(result.ok);
    assertEquals(result.data.items.map((open) => open.id).sort(), [100, 101]);
  } finally {
    h.database.restore();
  }
});

Deno.test("opens.get: an unknown id is NotFound", async () => {
  const h = harness();
  try {
    const result = await h.opens.get(999);
    assert(!result.ok);
    assertEquals(result.error, PushNotificationOpenError.NotFound);
  } finally {
    h.database.restore();
  }
});

Deno.test("opens.record: appends a row for the push", async () => {
  const h = harness();
  try {
    const result = await h.opens.record(2);
    assert(result.ok);
    assertEquals(h.database.rows("internal_t__notification_push_opens").length, 4);
  } finally {
    h.database.restore();
  }
});

Deno.test("opens.remove: an unknown id is NotFound, not a silent OK", async () => {
  const h = harness();
  try {
    const missing = await h.opens.remove(999);
    assert(!missing.ok);
    assertEquals(missing.error, PushNotificationOpenError.NotFound);
    assertEquals(h.database.rows("internal_t__notification_push_opens").length, 3);

    const removed = await h.opens.remove(100);
    assert(removed.ok);
    assertEquals(h.database.rows("internal_t__notification_push_opens").length, 2);
  } finally {
    h.database.restore();
  }
});
