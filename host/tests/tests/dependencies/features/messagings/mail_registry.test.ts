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

import { SmtpAccountError, SmtpAccountRepository } from "@scribe/host/dependencies/features/messagings/mail/accounts.ts";
import {
  MailStatisticError,
  MailStatisticRepository,
} from "@scribe/host/dependencies/features/messagings/mail/statistics.ts";
import { EmailTemplateError, EmailTemplateRepository } from "@scribe/host/dependencies/features/messagings/mail/templates.ts";
import type { Row } from "@scribe/core/testing/database/fake_postgrest.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { assert, assertEquals } from "@std/assert";

const TEMPLATES = "internal_t__email_templates";
const STATISTICS = "internal_t__mail_statistics";

function template(overrides: Partial<Row> = {}): Row {
  return {
    email_template_id: 1,
    name: "app/auth/confirm-account",
    subject: null,
    html: null,
    text: null,
    ...overrides,
  };
}

function statistic(overrides: Partial<Row> = {}): Row {
  return {
    statistic_id: 1,
    mail_id: 100,
    created_at: 1_000,
    ip_address: null,
    user_agent: null,
    ...overrides,
  };
}

// --- templates --------------------------------------------------------------

Deno.test("templates: the seeded rows carry a name and no content", async () => {
  const database = installDatabaseMock({ [TEMPLATES]: [template()] });

  try {
    const byId = await new EmailTemplateRepository().getById(1);
    const byName = await new EmailTemplateRepository().getByName("app/auth/confirm-account");

    assert(byId.ok && byName.ok);
    assertEquals(byId.data.name, "app/auth/confirm-account");
    assertEquals(
      byName.data.text,
      null,
      "rendering happens in TypeScript, so the column stays empty and interpolate() returns null",
    );
  } finally {
    database.restore();
  }
});

Deno.test("templates: an unknown id or name is not-found, never a null-ish success", async () => {
  const database = installDatabaseMock({ [TEMPLATES]: [template()] });

  try {
    const byId = await new EmailTemplateRepository().getById(999);
    const byName = await new EmailTemplateRepository().getByName("nope");

    assert(!byId.ok && !byName.ok);
    assertEquals(byId.error, EmailTemplateError.NotFound);
    assertEquals(byName.error, EmailTemplateError.NotFound);
  } finally {
    database.restore();
  }
});

Deno.test("templates: filling subject + text re-arms the interpolation fallback", async () => {
  const database = installDatabaseMock({ [TEMPLATES]: [template()] });

  try {
    const res = await new EmailTemplateRepository().update(1, {
      subject: "Bonjour {{name}}",
      text: "Contenu",
    });
    assert(res.ok);

    const row = database.rows(TEMPLATES)[0];
    assertEquals(row.subject, "Bonjour {{name}}");
    assertEquals(row.text, "Contenu");
    assertEquals(row.name, "app/auth/confirm-account", "the name is left alone");
  } finally {
    database.restore();
  }
});

Deno.test("templates: create then remove", async () => {
  const database = installDatabaseMock({ [TEMPLATES]: [] });

  try {
    const created = await new EmailTemplateRepository().create({
      name: "app/custom/hello",
      subject: "Salut",
      text: "Corps",
    });
    assert(created.ok);
    assertEquals(database.rows(TEMPLATES).length, 1);
    assertEquals(created.data.html, null, "html stays null when none is given");

    const removed = await new EmailTemplateRepository().remove(created.data.id);
    assert(removed.ok);
    assertEquals(database.rows(TEMPLATES).length, 0);
  } finally {
    database.restore();
  }
});

Deno.test("templates: list paginates most recent first", async () => {
  const database = installDatabaseMock({
    [TEMPLATES]: [
      template({ email_template_id: 1, name: "a" }),
      template({ email_template_id: 2, name: "b" }),
      template({ email_template_id: 3, name: "c" }),
    ],
  });

  try {
    const page = await new EmailTemplateRepository().list({ offset: 0, size: 2 });
    assert(page.ok);
    assertEquals(page.data.items.map((t) => t.name), ["c", "b"]);
    assertEquals(page.data.pagination.has_more, true);
  } finally {
    database.restore();
  }
});

// --- statistics -------------------------------------------------------------

Deno.test("statistics: record writes one open, list scopes to its mail", async () => {
  const database = installDatabaseMock({
    [STATISTICS]: [
      statistic({ statistic_id: 1, mail_id: 100 }),
      statistic({ statistic_id: 2, mail_id: 200 }),
    ],
  });

  try {
    const recorded = await new MailStatisticRepository().record({
      mailId: 100,
      ipAddress: "1.2.3.4",
      userAgent: "curl",
    });
    assert(recorded.ok);

    const list = await new MailStatisticRepository().list(100);
    assert(list.ok);
    assertEquals(
      list.data.items.every((s) => s.mailId === 100),
      true,
      "an open on another email never shows up",
    );
    assertEquals(list.data.items.length, 2);
  } finally {
    database.restore();
  }
});

Deno.test("statistics: an absent ip or user agent is stored as an explicit null", async () => {
  const database = installDatabaseMock({ [STATISTICS]: [] });

  try {
    await new MailStatisticRepository().record({ mailId: 100 });

    const row = database.rows(STATISTICS)[0];
    assertEquals(row.ip_address, null);
    assertEquals(row.user_agent, null);
  } finally {
    database.restore();
  }
});

Deno.test("statistics: an unknown id is not-found", async () => {
  const database = installDatabaseMock({ [STATISTICS]: [statistic()] });

  try {
    const res = await new MailStatisticRepository().get(999);
    assert(!res.ok);
    assertEquals(res.error, MailStatisticError.NotFound);
  } finally {
    database.restore();
  }
});

// --- SMTP accounts ----------------------------------------------------------

function accountsHarness(rows: Record<string, unknown>[]) {
  const database = installDatabaseMock({});
  database.onRpc("smtp_account_credentials", (args) => {
    const name = args?.p_name as string;
    return rows.filter((r) => r.name === name);
  });
  return { accounts: new SmtpAccountRepository(), restore: () => database.restore() };
}

Deno.test("accounts: a fully configured account comes back decrypted", async () => {
  const h = accountsHarness([
    { name: "billing", host: "smtp.x.io", port: 587, username: "u", password: "p" },
  ]);

  try {
    const res = await h.accounts.credentials("billing");
    assert(res.ok);
    assertEquals(res.data, {
      name: "billing",
      host: "smtp.x.io",
      port: 587,
      username: "u",
      password: "p",
    });
  } finally {
    h.restore();
  }
});

Deno.test("accounts: an unknown or inactive account is not-found", async () => {
  const h = accountsHarness([]);

  try {
    const res = await h.accounts.credentials("nope");
    assert(!res.ok);
    assertEquals(
      res.error,
      SmtpAccountError.NotFound,
      "the RPC already filters on is_active, so a row that was switched off never shows up",
    );
  } finally {
    h.restore();
  }
});

Deno.test("accounts: an env-backed row is reported incomplete, never half-used", async () => {
  const h = accountsHarness([
    { name: "noreply", host: null, port: null, username: null, password: null },
  ]);

  try {
    const res = await h.accounts.credentials("noreply");
    assert(!res.ok);
    assertEquals(
      res.error,
      SmtpAccountError.Incomplete,
      "the two accounts of the socle live in the environment, not in the database",
    );
  } finally {
    h.restore();
  }
});
