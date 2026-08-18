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

import { FOUNDATION_SMTP_ACCOUNTS, MailClient, MailError } from "@scribe/host/dependencies/features/messagings/mail/mail.ts";
import { installDatabaseMock } from "@scribe/foundation/tests/database/mocks/install_database.ts";
import { installMock } from "@scribe/core/testing/install.ts";
import nodemailer from "nodemailer";
import { assert, assertEquals } from "@std/assert";

function harness(accounts: Record<string, unknown>[] = []) {
  const database = installDatabaseMock({});
  let rpcCalls = 0;
  database.onRpc("smtp_account_credentials", (args) => {
    rpcCalls++;
    return accounts.filter((a) => a.name === args?.p_name);
  });

  const transport = installMock(
    nodemailer,
    "createTransport",
    (() => ({ sendMail: () => Promise.resolve({}) })) as typeof nodemailer.createTransport,
  );

  return {
    mail: new MailClient(),
    rpcCalls: (): number => rpcCalls,
    restore(): void {
      transport.restore();
      database.restore();
    },
  };
}

Deno.test("the two baseline accounts resolve without touching the database", async () => {
  const h = harness();

  try {
    const account = await h.mail.for(FOUNDATION_SMTP_ACCOUNTS.account);
    const noreply = await h.mail.for(FOUNDATION_SMTP_ACCOUNTS.noreply);

    assert(account.ok && noreply.ok);
    assertEquals(
      h.rpcCalls(),
      0,
      "account and noreply come from the environment, so sending auth mail has to work on an empty table",
    );
  } finally {
    h.restore();
  }
});

Deno.test("the baseline getters and for() return the very same sender", async () => {
  const h = harness();

  try {
    const viaFor = await h.mail.for(FOUNDATION_SMTP_ACCOUNTS.noreply);
    assert(viaFor.ok);
    assertEquals(viaFor.data, h.mail.noreply, "one SMTP transport per account, and no more");
  } finally {
    h.restore();
  }
});

Deno.test("a project account is resolved from the table", async () => {
  const h = harness([
    { name: "billing", host: "smtp.x.io", port: 587, username: "u", password: "p" },
  ]);

  try {
    const res = await h.mail.for("billing");
    assert(res.ok);
    assertEquals(h.rpcCalls(), 1);
  } finally {
    h.restore();
  }
});

Deno.test("a project account is read once, then served from cache", async () => {
  const h = harness([
    { name: "billing", host: "smtp.x.io", port: 587, username: "u", password: "p" },
  ]);

  try {
    const first = await h.mail.for("billing");
    const second = await h.mail.for("billing");

    assert(first.ok && second.ok);
    assertEquals(first.data, second.data, "the same instance is served again");
    assertEquals(h.rpcCalls(), 1, "one database round trip per account and per process");
  } finally {
    h.restore();
  }
});

Deno.test("an unknown account is a clean failure, not a crash", async () => {
  const h = harness([]);

  try {
    const res = await h.mail.for("does-not-exist");
    assert(!res.ok);
    assertEquals(res.error, MailError.AccountNotFound);
  } finally {
    h.restore();
  }
});

Deno.test("an account whose credentials are incomplete is refused too", async () => {
  const h = harness([
    { name: "half", host: "smtp.x.io", port: null, username: null, password: null },
  ]);

  try {
    const res = await h.mail.for("half");
    assert(!res.ok);
    assertEquals(res.error, MailError.AccountNotFound);
  } finally {
    h.restore();
  }
});

Deno.test("a failed lookup is not cached, a later insert is picked up", async () => {
  const accounts: Record<string, unknown>[] = [];
  const h = harness(accounts);

  try {
    const before = await h.mail.for("billing");
    assert(!before.ok);

    accounts.push({ name: "billing", host: "smtp.x.io", port: 587, username: "u", password: "p" });

    const after = await h.mail.for("billing");
    assert(after.ok, "adding a row is enough, with no process restart");
    assertEquals(h.rpcCalls(), 2);
  } finally {
    h.restore();
  }
});
