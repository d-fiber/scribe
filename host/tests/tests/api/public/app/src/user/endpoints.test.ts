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

import { CurrentDeviceEndpoint } from "@scribe/host/api/public/app/src/user/account/devices/current.ts";
import { ListDevicesEndpoint } from "@scribe/host/api/public/app/src/user/account/devices/list.ts";
import { RevokeDeviceEndpoint } from "@scribe/host/api/public/app/src/user/account/devices/revoke.ts";
import { ListIdentitiesEndpoint } from "@scribe/host/api/public/app/src/user/account/identities/list.ts";
import { UnlinkIdentityEndpoint } from "@scribe/host/api/public/app/src/user/account/identities/unlink.ts";
import { UpdateEmailEndpoint } from "@scribe/host/api/public/app/src/user/account/update/email.ts";
import { UpdatePhoneEndpoint } from "@scribe/host/api/public/app/src/user/account/update/phone.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueError, goTrueUser, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assert, assertEquals } from "@std/assert";

const USER_ID = "user-1";
const EMAIL = "u1@example.com";
const PHONE = "+33612345678";
const IDENTITY = { id: USER_ID, email: EMAIL };

function signedIn(extra: Record<string, unknown> = {}) {
  return { identity: IDENTITY, device: fakeDevice(), ...extra };
}

function appUsers() {
  return [{ user_id: USER_ID, email: EMAIL, phone: PHONE }];
}

function deviceRows() {
  return [
    {
      id: "row-1",
      user_id: USER_ID,
      device_id: "device-1",
      hash: "hash-1",
      trusted_at: Date.now(),
    },
    {
      id: "row-2",
      user_id: USER_ID,
      device_id: "device-2",
      hash: "hash-2",
      trusted_at: Date.now(),
    },
  ];
}

function identities(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    identity_id: `identity-${i + 1}`,
    id: USER_ID,
    user_id: USER_ID,
    provider: i === 0 ? "email" : "google",
    identity_data: { email: EMAIL },
    created_at: "2026-01-01T00:00:00Z",
    last_sign_in_at: null,
  }));
}

// --- PATCH /user/account/phone -------------------------------------------------

Deno.test("PATCH /account/update/phone: the update goes through gotrue, not straight to the table", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 200, body: goTrueUser({ phone: PHONE }) }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdatePhoneEndpoint.handle(),
      { phone: "+33700000000" },
      signedIn(),
    );

    assertEquals(res.status, 200);
    assertEquals(
      gotrue.called("PUT", "/user"),
      1,
      "without this call gotrue keeps the old number and sign-in by phone stays on it",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("PATCH /account/update/phone: a number already taken is a 409", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 422, body: goTrueError("phone_exists") }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdatePhoneEndpoint.handle(),
      { phone: "+33700000000" },
      signedIn(),
    );

    assertEquals(res.status, 409);
    assertEquals(res.body.code, "phone_already_used");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("PATCH /account/update/phone: an invalid number never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdatePhoneEndpoint.handle(),
      { phone: "123" },
      signedIn(),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_phone");
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("PATCH /account/update/phone: an anonymous caller is refused", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdatePhoneEndpoint.handle(),
      { phone: "+33700000000" },
      { device: fakeDevice() },
    );

    assertEquals(res.status, 401);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

// --- PATCH /user/account/email -------------------------------------------------

Deno.test("PATCH /account/update/email: a valid address is submitted to gotrue", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 200, body: goTrueUser() }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdateEmailEndpoint.handle(),
      { email: "new@example.com" },
      signedIn(),
    );

    assertEquals(res.status, 200);
    assertEquals(gotrue.called("PUT", "/user"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("PATCH /account/update/email: an address already taken is a 409", async () => {
  const gotrue = installGoTrueMock({
    "PUT /user": () => ({ status: 422, body: goTrueError("email_exists") }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdateEmailEndpoint.handle(),
      { email: "taken@example.com" },
      signedIn(),
    );

    assertEquals(res.status, 409);
    assertEquals(res.body.code, "email_already_used");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("PATCH /account/update/email: an invalid address never reaches gotrue", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UpdateEmailEndpoint.handle(),
      { email: "not-an-address" },
      signedIn(),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "invalid_email");
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

// --- devices ---------------------------------------------------------------------

Deno.test("GET /user/account/devices: lists the caller's devices", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__app_user_devices: deviceRows(),
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => ListDevicesEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    assertEquals((res.body.data as unknown[]).length, 2);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("GET /user/account/devices: an anonymous caller is refused", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({ internal_t__app_user_devices: deviceRows() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => ListDevicesEndpoint.handle(), {}, {
      method: "GET",
      device: fakeDevice(),
    });

    assertEquals(res.status, 401);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("GET /user/account/devices/current: resolves the device carrying the request", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__app_user_devices: deviceRows(),
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => CurrentDeviceEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    assertEquals((res.body.data as Record<string, unknown>).device_id, "device-1");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("DELETE /user/account/devices/:id: revokes another device", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__app_user_devices: deviceRows(),
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => RevokeDeviceEndpoint.handle("device-2"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
    assertEquals(rest.rows("internal_t__app_user_devices").length, 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("DELETE /user/account/devices/:id: the current device cannot be revoked this way", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__app_user_devices: deviceRows(),
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => RevokeDeviceEndpoint.handle("device-1"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "current_device");
    assertEquals(
      rest.rows("internal_t__app_user_devices").length,
      2,
      "revoking your own device would sign you out sideways: sign-out is the right verb",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("DELETE /user/account/devices/:id: a device owned by someone else is a 404", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__app_users: appUsers(),
    internal_t__app_user_devices: [
      {
        id: "row-9",
        user_id: "someone-else",
        device_id: "device-9",
        hash: "hash-9",
        trusted_at: Date.now(),
      },
    ],
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => RevokeDeviceEndpoint.handle("device-9"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assertEquals(
      rest.rows("internal_t__app_user_devices").length,
      1,
      "another user's device must survive",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

// --- identities --------------------------------------------------------------------

Deno.test("GET /user/account/identities: lists the linked providers", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({
      status: 200,
      body: goTrueUser({ identities: identities(2) }),
    }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => ListIdentitiesEndpoint.handle(),
      {},
      signedIn({ method: "GET" }),
    );

    assertEquals(res.status, 200);
    const data = res.body.data as Record<string, unknown>[];
    assertEquals(data.length, 2);
    assertEquals(data[0].provider, "email");
    assertEquals(data[1].provider, "google");
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("DELETE /user/account/identities/:id: unlinks a secondary provider", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({
      status: 200,
      body: goTrueUser({ identities: identities(2) }),
    }),
    "DELETE /user/identities/*": () => ({ status: 204 }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UnlinkIdentityEndpoint.handle("identity-2"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
    assertEquals(gotrue.called("DELETE", "/user/identities/identity-2"), 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("DELETE /user/account/identities/:id: the last identity cannot be unlinked", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({
      status: 200,
      body: goTrueUser({ identities: identities(1) }),
    }),
    "DELETE /user/identities/*": () => ({ status: 204 }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UnlinkIdentityEndpoint.handle("identity-1"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 400);
    assertEquals(res.body.code, "last_identity");
    assertEquals(
      gotrue.called("DELETE", "/user/identities/identity-1"),
      0,
      "removing the only sign-in method would strand the account",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("DELETE /user/account/identities/:id: an identity that is not the caller's is a 404", async () => {
  const gotrue = installGoTrueMock({
    "GET /user": () => ({
      status: 200,
      body: goTrueUser({ identities: identities(2) }),
    }),
    "DELETE /user/identities/*": () => ({ status: 204 }),
  });
  const rest = installRestMock({ internal_t__app_users: appUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => UnlinkIdentityEndpoint.handle("identity-of-someone-else"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 404);
    assert(
      gotrue.calls.every((c) => c.method !== "DELETE"),
      "an identity id that is not in the caller's own list must never be forwarded",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("GET /user/account/identities: an anonymous caller is refused", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({});
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => ListIdentitiesEndpoint.handle(), {}, {
      method: "GET",
      device: fakeDevice(),
    });

    assertEquals(res.status, 401);
    assertEquals(gotrue.calls.length, 0);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});
