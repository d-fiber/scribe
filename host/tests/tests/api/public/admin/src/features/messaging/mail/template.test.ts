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

import { AdminEmailTemplateCreateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/template/create.ts";
import { AdminEmailTemplateDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/template/delete.ts";
import { AdminEmailTemplateListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/template/list.ts";
import {
  AdminEmailTemplateReadByNameEndpoint,
  AdminEmailTemplateReadEndpoint,
} from "@scribe/host/api/public/admin/src/features/messaging/mail/template/read.ts";
import { AdminEmailTemplateUpdateEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/template/update.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";

const ADMIN = {
  id: "admin-1",
  email: "admin@example.com",
  rules: { role: "owner", permissions: [] },
};

const USER_WITHOUT_RULES = { id: "user-1", email: "user@example.com" };

function signedIn(extra: Record<string, unknown> = {}) {
  return { identity: ADMIN, device: fakeDevice(), ...extra };
}

function templateRows(): Row[] {
  return [
    {
      email_template_id: 1,
      name: "app/account/new-device",
      subject: "New device",
      html: "<p>hi</p>",
      text: "hi",
    },
    {
      email_template_id: 2,
      name: "admin/account/welcome",
      subject: null,
      html: null,
      text: null,
    },
  ];
}

function harness(rows = templateRows()) {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__email_templates: rows });
  const env = installAuthEnv();

  return {
    rest,
    restore() {
      env.restore();
      rest.restore();
      gotrue.restore();
    },
  };
}

Deno.test("GET /template: lists the templates", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const data = res.body.data as { templates: unknown[] };
    assertEquals(data.templates.length, 2);
  } finally {
    h.restore();
  }
});

Deno.test("GET /template: a signed-in user without rules is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateListEndpoint.handle(),
      {},
      { identity: USER_WITHOUT_RULES, device: fakeDevice(), method: "GET" },
    );

    assertEquals(res.status, 401, "Caller.Admin must reject a plain user identity");
  } finally {
    h.restore();
  }
});

Deno.test("GET /template/:id: reads one, 404 on an unknown id", async () => {
  const h = harness();
  try {
    const found = await callEndpoint(
      () => AdminEmailTemplateReadEndpoint.handle("1"),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(found.status, 200);
    assertEquals((found.body.data as { name: string }).name, "app/account/new-device");

    const missing = await callEndpoint(
      () => AdminEmailTemplateReadEndpoint.handle("404"),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(missing.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("GET /template/:id: a non-numeric id is a 400, not a 404", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateReadEndpoint.handle("abc"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_id");
  } finally {
    h.restore();
  }
});

Deno.test("GET /template/by-name/:name: resolves a slash-separated name", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateReadByNameEndpoint.handle("app/account/new-device"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(
      res.status,
      200,
      "every real template name is hierarchical: app/... or admin/...",
    );
    assertEquals((res.body.data as { id: number }).id, 1);
  } finally {
    h.restore();
  }
});

Deno.test("GET /template/by-name/:name: a flat name still resolves", async () => {
  const h = harness([
    { email_template_id: 9, name: "welcome", subject: "Hi", html: null, text: "Hi" },
  ] as Row[]);
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateReadByNameEndpoint.handle("welcome"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    assertEquals((res.body.data as { id: number }).id, 9);
  } finally {
    h.restore();
  }
});

Deno.test("GET /template/by-name/:name: a malformed name is a 400", async () => {
  const h = harness();
  try {
    for (const name of ["has spaces", "trailing/", "/leading", "double//slash"]) {
      const res = await callEndpoint(
        () => AdminEmailTemplateReadByNameEndpoint.handle(name),
        {},
        signedIn({ method: "GET" }),
      );

      assertEquals(res.status, 400, `"${name}" must be rejected`);
      assertEquals(res.body.code, "invalid_name");
    }
  } finally {
    h.restore();
  }
});

Deno.test("POST /template: creates and returns 201", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateCreateEndpoint.handle(),
      { name: "billing.receipt", subject: "Receipt", text: "Thanks", html: "<p>Thanks</p>" },
      signedIn(),
    );

    assertEquals(res.status, 201);
    assertEquals(h.rest.rows("internal_t__email_templates").length, 3);
  } finally {
    h.restore();
  }
});

Deno.test("POST /template: rejects a name outside the charset", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateCreateEndpoint.handle(),
      { name: "has spaces", subject: "s", text: "t" },
      signedIn(),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_name");
    assertEquals(h.rest.rows("internal_t__email_templates").length, 2, "nothing written");
  } finally {
    h.restore();
  }
});

Deno.test("POST /template: subject and text are required and non-blank", async () => {
  const h = harness();
  try {
    const noSubject = await callEndpoint(
      () => AdminEmailTemplateCreateEndpoint.handle(),
      { name: "x", text: "t" },
      signedIn(),
    );
    assertEquals(noSubject.status, 400);
    assertEquals(noSubject.body.code, "invalid_subject");

    const blankText = await callEndpoint(
      () => AdminEmailTemplateCreateEndpoint.handle(),
      { name: "x", subject: "s", text: "   " },
      signedIn(),
    );
    assertEquals(blankText.status, 400);
    assertEquals(blankText.body.code, "invalid_text");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /template/:id: an empty patch is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateUpdateEndpoint.handle("1"),
      {},
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "empty_patch");
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /template/:id: 404 on an unknown id instead of a silent 200", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateUpdateEndpoint.handle("404"),
      { subject: "changed" },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(
      res.status,
      404,
      "QueryBuilder.update() returns true on zero rows: the endpoint must pre-read",
    );
  } finally {
    h.restore();
  }
});

Deno.test("PATCH /template/:id: writes only the given fields", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateUpdateEndpoint.handle("1"),
      { subject: "changed" },
      signedIn({ method: "PATCH" }),
    );
    assertEquals(res.status, 200);

    const row = h.rest.rows("internal_t__email_templates").find((r) => r.email_template_id === 1);
    assertEquals(row?.subject, "changed");
    assertEquals(row?.text, "hi", "untouched fields keep their value");
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /template/:id: 404 on an unknown id instead of a silent 200", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateDeleteEndpoint.handle("404"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(h.rest.rows("internal_t__email_templates").length, 2);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /template/:id: removes the row", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminEmailTemplateDeleteEndpoint.handle("1"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
    const remaining = h.rest.rows("internal_t__email_templates");
    assertEquals(remaining.length, 1);
    assert(remaining.every((row) => row.email_template_id !== 1));
  } finally {
    h.restore();
  }
});
