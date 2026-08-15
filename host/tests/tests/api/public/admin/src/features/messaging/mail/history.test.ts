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

import { AdminMailMessageDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/message/delete.ts";
import { AdminMailMessageListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/message/list.ts";
import { AdminMailMessageReadEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/message/read.ts";
import { AdminMailStatisticsDeleteEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/statistics/delete.ts";
import { AdminMailStatisticsListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/statistics/list.ts";
import { AdminMailStatisticsReadEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/statistics/read.ts";
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

function mails(): Row[] {
  return [
    {
      mail_id: 1,
      recipient: "ada@example.com",
      subject: "Welcome",
      email_template_id: 1,
      data: null,
      status: "sent",
      account: "noreply",
      tracking_token: "TOKEN000000001",
      created_at: 10,
      updated_at: 10,
    },
    {
      mail_id: 2,
      recipient: "grace@example.com",
      subject: null,
      email_template_id: null,
      data: null,
      status: "failed",
      account: "account",
      tracking_token: "TOKEN000000002",
      created_at: 20,
      updated_at: 20,
    },
  ];
}

function statistics(): Row[] {
  return [
    { statistic_id: 100, mail_id: 1, ip_address: "1.2.3.4", user_agent: "UA", created_at: 30 },
    { statistic_id: 101, mail_id: 1, ip_address: null, user_agent: null, created_at: 40 },
    { statistic_id: 102, mail_id: 2, ip_address: null, user_agent: null, created_at: 50 },
  ];
}

function harness() {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__mails: mails(),
    internal_t__mail_statistics: statistics(),
  });
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

Deno.test("GET /message: lists the whole history, whatever the sending account", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailMessageListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { messages } = res.body.data as { messages: { smtp_account: string }[] };
    assertEquals(
      messages.length,
      2,
      "reads go through mail.noreply but are not scoped to that account",
    );
    assertEquals(
      [...new Set(messages.map((m) => m.smtp_account))].sort(),
      ["account", "noreply"],
    );
  } finally {
    h.restore();
  }
});

Deno.test("GET /message?recipient=: narrows to one recipient", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailMessageListEndpoint.handle(),
      {},
      signedIn({ method: "GET", path: "/?recipient=ada@example.com" }),
    );

    assertEquals(res.status, 200);
    const { messages } = res.body.data as { messages: { recipient: string }[] };
    assertEquals(messages.map((m) => m.recipient), ["ada@example.com"]);
  } finally {
    h.restore();
  }
});

Deno.test("GET /message/:id: reads one, 404 on an unknown id", async () => {
  const h = harness();
  try {
    const found = await callEndpoint(
      () => AdminMailMessageReadEndpoint.handle("1"),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(found.status, 200);
    assertEquals((found.body.data as { recipient: string }).recipient, "ada@example.com");

    const missing = await callEndpoint(
      () => AdminMailMessageReadEndpoint.handle("404"),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(missing.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /message/:id: 404 on an unknown id instead of a silent 200", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailMessageDeleteEndpoint.handle("404"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(h.rest.rows("internal_t__mails").length, 2);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /message/:id: removes the row", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailMessageDeleteEndpoint.handle("1"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
    const remaining = h.rest.rows("internal_t__mails");
    assertEquals(remaining.length, 1);
    assert(remaining.every((row) => row.mail_id !== 1));
  } finally {
    h.restore();
  }
});

Deno.test("GET /statistics/message/:id: only the opens of that mail", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailStatisticsListEndpoint.handle("1"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { statistics: opens } = res.body.data as { statistics: { id: number }[] };
    assertEquals(opens.map((o) => o.id).sort(), [100, 101]);
  } finally {
    h.restore();
  }
});

Deno.test("GET /statistics/message/:id: an unknown mail is a 404, not an empty page", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailStatisticsListEndpoint.handle("404"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(
      res.status,
      404,
      "'unknown mail' and 'mail with no open yet' must not look the same",
    );
  } finally {
    h.restore();
  }
});

Deno.test("GET /statistics/:id: reads one, 404 on an unknown id", async () => {
  const h = harness();
  try {
    const found = await callEndpoint(
      () => AdminMailStatisticsReadEndpoint.handle("100"),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(found.status, 200);
    assertEquals((found.body.data as { mail_id: number }).mail_id, 1);

    const missing = await callEndpoint(
      () => AdminMailStatisticsReadEndpoint.handle("999"),
      {},
      signedIn({ method: "GET" }),
    );
    assertEquals(missing.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /statistics/:id: 404 on an unknown id instead of a silent 200", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailStatisticsDeleteEndpoint.handle("999"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(h.rest.rows("internal_t__mail_statistics").length, 3);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /statistics/:id: removes the row", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminMailStatisticsDeleteEndpoint.handle("100"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
    assertEquals(h.rest.rows("internal_t__mail_statistics").length, 2);
  } finally {
    h.restore();
  }
});
