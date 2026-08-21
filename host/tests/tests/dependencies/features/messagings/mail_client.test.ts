// Copyright (C) 2026 Fiber
//
// This Source Code Form is subject to the terms of the Mozilla Public License,
// v. 2.0. If a copy of the MPL was not distributed with this file, You can
// obtain one at https://mozilla.org/MPL/2.0/.
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
// - Combine it with files under any other licence, proprietary ones included,
//   and licence that larger work on your own terms.
//
// What you must do in return:
// - Keep this notice on every file you received it on.
// - Publish, under these same terms, the source of every file covered by them
//   that you distribute, including the ones you changed, so that whoever
//   receives your version can obtain that source.
// - Leave Fiber out of it: the name "Fiber", its branding, its logos and its
//   trademarks may not be used to endorse or promote what you build, and this
//   licence grants no right to them.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OR CONDITION OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
// NON-INFRINGEMENT. IN NO EVENT SHALL FIBER BE LIABLE FOR ANY DIRECT, INDIRECT,
// INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT
// LIMITED TO LOSS OF USE, DATA, PROFITS, OR BUSINESS INTERRUPTION) ARISING OUT
// OF OR RELATED TO THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY
// KIND OF LEGAL CLAIM.
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
