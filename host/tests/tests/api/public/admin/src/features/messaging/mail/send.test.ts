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

import { AdminMailSendEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/send.ts";
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

function signedIn(extra: Record<string, unknown> = {}) {
  return { identity: ADMIN, device: fakeDevice(), ...extra };
}

function templates(): Row[] {
  return [{ email_template_id: 1, name: "welcome", subject: "Hi", html: null, text: "Hi" }];
}

function harness() {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__email_templates: templates(),
    internal_t__mails: [],
  });
  const env = installAuthEnv();

  rest.onRpc("smtp_account_credentials", () => []);

  return {
    rest,
    mails: () => rest.rows("internal_t__mails"),
    restore() {
      env.restore();
      rest.restore();
      gotrue.restore();
    },
  };
}

Deno.test("POST /send: a template send is accepted and queued as pending", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "someone@example.com", template_name: "welcome", data: { name: "Ada" } },
      signedIn(),
    );

    assertEquals(
      res.status,
      202,
      "the endpoint inserts a pending mail, the DB trigger does the sending",
    );

    const mails = h.mails();
    assertEquals(mails.length, 1);
    assertEquals(mails[0].recipient, "someone@example.com");
    assertEquals(mails[0].status, "pending");
    assertEquals(mails[0].email_template_id, 1);
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: an inline send carries its own content", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "someone@example.com", subject: "Direct", text: "Body", html: "<p>Body</p>" },
      signedIn(),
    );

    assertEquals(res.status, 202);
    const mails = h.mails();
    assertEquals(mails.length, 1);
    assertEquals(mails[0].email_template_id, null, "an inline send has no template");
    assertEquals((mails[0].data as Record<string, unknown>).subject, "Direct");
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: the two modes are exclusive", async () => {
  const h = harness();
  try {
    const both = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "a@b.co", template_name: "welcome", subject: "s", text: "t" },
      signedIn(),
    );
    assertEquals(both.status, 400);
    assertEquals(both.body.code, "ambiguous_payload");

    const neither = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "a@b.co" },
      signedIn(),
    );
    assertEquals(neither.status, 400);

    assertEquals(h.mails().length, 0, "no mail is written on a rejected payload");
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: an inline send needs both a subject and a text", async () => {
  const h = harness();
  try {
    for (const body of [{ subject: "only" }, { text: "only" }]) {
      const res = await callEndpoint(
        () => AdminMailSendEndpoint.handle(),
        { to: "a@b.co", ...body },
        signedIn(),
      );

      assertEquals(res.status, 400, `${JSON.stringify(body)} is not a complete inline send`);
    }
    assertEquals(h.mails().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: an unknown template is a 422", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "a@b.co", template_name: "does-not-exist" },
      signedIn(),
    );

    assertEquals(res.status, 422);
    assertEquals(res.body.code, "template_not_found");
    assertEquals(h.mails().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: an unknown SMTP account is a 422", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "a@b.co", account: "ghost", template_name: "welcome" },
      signedIn(),
    );

    assertEquals(res.status, 422);
    assertEquals(res.body.code, "account_not_found");
    assertEquals(h.mails().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: a malformed recipient is refused", async () => {
  const h = harness();
  try {
    for (const to of ["", "not-an-email", "a@b", "a b@c.co", "@example.com"]) {
      const res = await callEndpoint(
        () => AdminMailSendEndpoint.handle(),
        { to, template_name: "welcome" },
        signedIn(),
      );

      assertEquals(res.status, 400, `"${to}" must be refused`);
      assertEquals(res.body.code, "invalid_to");
    }
    assertEquals(h.mails().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: an anonymous caller cannot send", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "a@b.co", template_name: "welcome" },
      { device: fakeDevice() },
    );

    assertEquals(res.status, 401);
    assertEquals(h.mails().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("POST /send: the rate limit is its own bucket, tighter than the writes", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__email_templates: templates(),
    internal_t__mails: [],
  });
  const env = installAuthEnv();

  try {
    env.block("AdminMailSendEndpoint");

    const res = await callEndpoint(
      () => AdminMailSendEndpoint.handle(),
      { to: "a@b.co", template_name: "welcome" },
      signedIn(),
    );

    assertEquals(res.status, 429);
    assert(
      rest.rows("internal_t__mails").length === 0,
      "a throttled call must not reach the insert",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
