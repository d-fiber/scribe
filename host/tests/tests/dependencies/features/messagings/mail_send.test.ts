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

import { MailError, MailSenderSmtp, MailStatus } from "@scribe/host/dependencies/features/messagings/mail/send.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import nodemailer from "nodemailer";
import { assert, assertEquals } from "@std/assert";

const MAILS = "internal_t__mails";
const TEMPLATES = "internal_t__email_templates";

interface SentMail {
  to: string;
  subject: string;
  html?: string;
  text: string;
  from: string;
}

function mail(overrides: Partial<Row> = {}): Row {
  return {
    mail_id: 1,
    email_template_id: null,
    recipient: "a@b.test",
    subject: null,
    data: null,
    status: MailStatus.Pending,
    account: "account",
    tracking_token: "tok-1",
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

function harness(options: { mails?: Row[]; templates?: Row[]; failSmtp?: boolean } = {}) {
  const rest = installRestMock({
    [MAILS]: options.mails ?? [],
    [TEMPLATES]: options.templates ?? [],
  });

  const sent: SentMail[] = [];
  const transport = installMock(
    nodemailer,
    "createTransport",
    (() => ({
      sendMail: (m: SentMail) => {
        if (options.failSmtp) return Promise.reject(new Error("smtp down"));
        sent.push(m);
        return Promise.resolve({});
      },
    })) as typeof nodemailer.createTransport,
  );

  return {
    sender: new MailSenderSmtp("account", {
      host: "h",
      port: 587,
      user: "user@x.test",
      pass: "p",
    }),
    sent: (): SentMail[] => sent,
    rows: (): Row[] => rest.rows(MAILS),
    restore(): void {
      transport.restore();
      rest.restore();
    },
  };
}

Deno.test("create resolves the template by name and queues a pending mail", async () => {
  const h = harness({
    templates: [{ email_template_id: 7, name: "app/auth/confirm-account", subject: null, html: null, text: null }],
  });

  try {
    const res = await h.sender.create("a@b.test", "app/auth/confirm-account", { userId: "u1" });

    assert(res.ok);
    assertEquals(res.data.emailTemplateId, 7);
    assertEquals(res.data.status, MailStatus.Pending);
    assert(res.data.openToken.length > 0, "the tracking token is generated on the client side");
    assertEquals(h.sent().length, 0, "create sends nothing, it queues");
  } finally {
    h.restore();
  }
});

Deno.test("create refuses an unknown template without writing a mail", async () => {
  const h = harness({ templates: [] });

  try {
    const res = await h.sender.create("a@b.test", "nope", {});

    assert(!res.ok);
    assertEquals(res.error, MailError.TemplateNotFound);
    assertEquals(h.rows().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("createRaw queues a mail with no template and the content as data", async () => {
  const h = harness();

  try {
    const res = await h.sender.createRaw("a@b.test", { subject: "Sujet", text: "Corps" });

    assert(res.ok);
    assertEquals(res.data.emailTemplateId, null);
    assertEquals((h.rows()[0].data as Record<string, unknown>).subject, "Sujet");
  } finally {
    h.restore();
  }
});

Deno.test("two mails never share a tracking token", async () => {
  const h = harness();

  try {
    const a = await h.sender.createRaw("a@b.test", { subject: "s", text: "t" });
    const b = await h.sender.createRaw("c@d.test", { subject: "s", text: "t" });

    assert(a.ok && b.ok);
    assert(a.data.openToken !== b.data.openToken);
  } finally {
    h.restore();
  }
});

Deno.test("deliver sends over SMTP, marks the mail sent and snapshots the subject", async () => {
  const h = harness({ mails: [mail({ mail_id: 1, tracking_token: "tok-abc" })] });

  try {
    const res = await h.sender.deliver(1, { subject: "Bienvenue", html: "<p>hi</p>", text: "hi" });

    assert(res.ok);
    assertEquals(h.sent().length, 1);
    assertEquals(h.sent()[0].to, "a@b.test");
    assertEquals(h.sent()[0].subject, "Bienvenue");

    const row = h.rows()[0];
    assertEquals(row.status, MailStatus.Sent);
    assertEquals(row.subject, "Bienvenue", "the subject that was actually sent is frozen on the row");
  } finally {
    h.restore();
  }
});

Deno.test("deliver injects the tracking pixel into the html body", async () => {
  const h = harness({ mails: [mail({ mail_id: 1, tracking_token: "tok-abc" })] });

  try {
    await h.sender.deliver(1, { subject: "s", html: "<p>hi</p>", text: "hi" });

    const html = h.sent()[0].html ?? "";
    assert(html.includes("/v1/app/mail/open/tok-abc"), "the pixel carries the token, never the mail_id");
    assert(html.startsWith("<p>hi</p>"), "the original body is preserved");
  } finally {
    h.restore();
  }
});

Deno.test("a text-only mail gets no pixel rather than a broken one", async () => {
  const h = harness({ mails: [mail({ mail_id: 1 })] });

  try {
    await h.sender.deliver(1, { subject: "s", text: "hi" });
    assertEquals(h.sent()[0].html, undefined);
  } finally {
    h.restore();
  }
});

Deno.test("an SMTP failure marks the mail failed and reports it", async () => {
  const h = harness({ mails: [mail({ mail_id: 1 })], failSmtp: true });

  try {
    const res = await h.sender.deliver(1, { subject: "s", text: "hi" });

    assert(!res.ok);
    assertEquals(res.error, MailError.SmtpFailed);
    assertEquals(
      h.rows()[0].status,
      MailStatus.Failed,
      "the status is written despite the failure, so the row does not stay pending",
    );
  } finally {
    h.restore();
  }
});

Deno.test("deliver on an unknown mail is not-found and sends nothing", async () => {
  const h = harness({ mails: [] });

  try {
    const res = await h.sender.deliver(999, { subject: "s", text: "hi" });

    assert(!res.ok);
    assertEquals(res.error, MailError.NotFound);
    assertEquals(h.sent().length, 0);
  } finally {
    h.restore();
  }
});

Deno.test("getByOpenToken finds the mail behind a tracking pixel", async () => {
  const h = harness({ mails: [mail({ mail_id: 42, tracking_token: "tok-xyz" })] });

  try {
    const found = await h.sender.getByOpenToken("tok-xyz");
    const missing = await h.sender.getByOpenToken("tok-nope");

    assert(found.ok && !missing.ok);
    assertEquals(found.data.id, 42);
    assertEquals(missing.error, MailError.NotFound);
  } finally {
    h.restore();
  }
});

Deno.test("list filters by recipient and pages most recent first", async () => {
  const h = harness({
    mails: [
      mail({ mail_id: 1, recipient: "a@b.test", created_at: 100, tracking_token: "t1" }),
      mail({ mail_id: 2, recipient: "c@d.test", created_at: 200, tracking_token: "t2" }),
      mail({ mail_id: 3, recipient: "a@b.test", created_at: 300, tracking_token: "t3" }),
    ],
  });

  try {
    const all = await h.sender.list();
    const scoped = await h.sender.list({ recipient: "a@b.test" });

    assert(all.ok && scoped.ok);
    assertEquals(all.data.items.map((m) => m.id), [3, 2, 1]);
    assertEquals(scoped.data.items.map((m) => m.id), [3, 1]);
  } finally {
    h.restore();
  }
});
