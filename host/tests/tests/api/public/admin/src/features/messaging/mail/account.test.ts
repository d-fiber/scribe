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
  AdminSmtpAccountCredentialsDeleteEndpoint,
  AdminSmtpAccountDeleteEndpoint,
} from "@scribe/host/api/public/admin/src/features/messaging/mail/account/delete.ts";
import { AdminSmtpAccountListEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/account/list.ts";
import { AdminSmtpAccountReadEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/account/read.ts";
import { AdminSmtpAccountStatusEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/account/status.ts";
import { AdminSmtpAccountUpsertEndpoint } from "@scribe/host/api/public/admin/src/features/messaging/mail/account/upsert.ts";
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

function summary(name: string, configured: boolean) {
  return {
    name,
    host: configured ? "smtp.example.com" : null,
    port: configured ? 587 : null,
    username: configured ? "user@example.com" : null,
    is_configured: configured,
    is_active: true,
    created_at: 1,
    updated_at: 2,
  };
}

interface RpcOverrides {
  readonly deleteOutcome?: string;
  readonly toggle?: boolean;
}

function harness(overrides: RpcOverrides = {}) {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  const upserted: Record<string, unknown>[] = [];

  rest.onRpc("smtp_accounts_list", () => [summary("account", false), summary("billing", true)]);
  rest.onRpc("smtp_account_summary", (args) => {
    const name = args?.p_name as string;
    return name === "billing" || name === "account" ? [summary(name, name === "billing")] : [];
  });
  rest.onRpc("upsert_smtp_account", (args) => {
    upserted.push(args ?? {});
    return 1;
  });
  rest.onRpc("set_smtp_account_active", () => overrides.toggle ?? true);
  rest.onRpc("clear_smtp_account_credentials", () => overrides.toggle ?? true);
  rest.onRpc("delete_smtp_account", () => overrides.deleteOutcome ?? "deleted");

  return {
    upserted,
    restore() {
      env.restore();
      rest.restore();
      gotrue.restore();
    },
  };
}

Deno.test("GET /account: never exposes a password", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const { accounts } = res.body.data as { accounts: Record<string, unknown>[] };
    assertEquals(accounts.length, 2);

    const serialized = JSON.stringify(res.body);
    assert(!serialized.includes("password"), "no password key may reach the response");

    assertEquals(accounts.find((a) => a.name === "account")?.is_configured, false);
    assertEquals(accounts.find((a) => a.name === "billing")?.is_configured, true);
  } finally {
    h.restore();
  }
});

Deno.test("GET /account/:name: 404 on an unknown account", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountReadEndpoint.handle("nope"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("GET /account/:name: a malformed name is a 400", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountReadEndpoint.handle("Has Spaces"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_name");
  } finally {
    h.restore();
  }
});

Deno.test("PUT /account/:name: forwards the five arguments to the encrypting RPC", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountUpsertEndpoint.handle("billing"),
      {
        host: "smtp.example.com",
        port: 587,
        username: "user@example.com",
        password: "s3cret",
      },
      signedIn({ method: "PUT" }),
    );

    assertEquals(res.status, 200);
    assertEquals(h.upserted.length, 1);
    assertEquals(h.upserted[0].p_name, "billing");
    assertEquals(h.upserted[0].p_password, "s3cret");

    assert(
      !JSON.stringify(res.body).includes("s3cret"),
      "the password goes in, it never comes back out",
    );
  } finally {
    h.restore();
  }
});

Deno.test("PUT /account/:name: a partial credential set is refused", async () => {
  const h = harness();
  const cases = [
    { port: 587, username: "u", password: "p" },
    { host: "h", username: "u", password: "p" },
    { host: "h", port: 587, password: "p" },
    { host: "h", port: 587, username: "u" },
  ];

  try {
    for (const body of cases) {
      const res = await callEndpoint(
        () => AdminSmtpAccountUpsertEndpoint.handle("billing"),
        body,
        signedIn({ method: "PUT" }),
      );

      assertEquals(res.status, 400, `${JSON.stringify(body)} must be refused`);
    }
    assertEquals(
      h.upserted.length,
      0,
      "smtp_accounts_complete_or_env forbids half a configuration: catch it before the RPC",
    );
  } finally {
    h.restore();
  }
});

Deno.test("PUT /account/:name: the port must be a valid TCP port", async () => {
  const h = harness();
  const credentials = { host: "h", username: "u", password: "p" };

  try {
    for (const port of [0, -1, 65536, 587.5, "587"]) {
      const res = await callEndpoint(
        () => AdminSmtpAccountUpsertEndpoint.handle("billing"),
        { ...credentials, port },
        signedIn({ method: "PUT" }),
      );

      assertEquals(res.status, 400, `port ${port} must be refused`);
      assertEquals(res.body.code, "invalid_port");
    }
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /account/:name: a foundation account is a 403", async () => {
  const h = harness({ deleteOutcome: "reserved" });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountDeleteEndpoint.handle("noreply"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 403);
    assertEquals(res.body.code, "reserved_account");
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /account/:name: an account with sent mails is a 409", async () => {
  const h = harness({ deleteOutcome: "in_use" });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountDeleteEndpoint.handle("billing"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 409);
    assertEquals(res.body.code, "account_in_use");
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /account/:name: an unknown account is a 404", async () => {
  const h = harness({ deleteOutcome: "not_found" });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountDeleteEndpoint.handle("nope"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /account/:name: a deletable account is a 200", async () => {
  const h = harness({ deleteOutcome: "deleted" });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountDeleteEndpoint.handle("billing"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
  } finally {
    h.restore();
  }
});

Deno.test("DELETE /account/:name/credentials: falls back to the env, 404 if unknown", async () => {
  const ok = harness({ toggle: true });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountCredentialsDeleteEndpoint.handle("billing"),
      {},
      signedIn({ method: "DELETE" }),
    );
    assertEquals(res.status, 200);
  } finally {
    ok.restore();
  }

  const missing = harness({ toggle: false });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountCredentialsDeleteEndpoint.handle("nope"),
      {},
      signedIn({ method: "DELETE" }),
    );
    assertEquals(res.status, 404);
  } finally {
    missing.restore();
  }
});

Deno.test("PATCH /account/:name/status: toggles, 404 if unknown", async () => {
  const ok = harness({ toggle: true });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountStatusEndpoint.handle("billing"),
      { is_active: false },
      signedIn({ method: "PATCH" }),
    );
    assertEquals(res.status, 200);
  } finally {
    ok.restore();
  }

  const missing = harness({ toggle: false });
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountStatusEndpoint.handle("nope"),
      { is_active: false },
      signedIn({ method: "PATCH" }),
    );
    assertEquals(res.status, 404);
  } finally {
    missing.restore();
  }
});

Deno.test("PATCH /account/:name/status: a non-boolean is refused", async () => {
  const h = harness();
  try {
    const res = await callEndpoint(
      () => AdminSmtpAccountStatusEndpoint.handle("billing"),
      { is_active: 1 },
      signedIn({ method: "PATCH" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_is_active");
  } finally {
    h.restore();
  }
});

Deno.test("account: the decrypting RPC is never reached from the admin surface", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  let decrypted = 0;
  rest.onRpc("smtp_accounts_list", () => [summary("billing", true)]);
  rest.onRpc("smtp_account_summary", () => [summary("billing", true)]);
  rest.onRpc("smtp_account_credentials", () => {
    decrypted++;
    return [];
  });

  try {
    await callEndpoint(
      () => AdminSmtpAccountListEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );
    await callEndpoint(
      () => AdminSmtpAccountReadEndpoint.handle("billing"),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(
      decrypted,
      0,
      "smtp_account_credentials is the sending path only, never an admin read",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
