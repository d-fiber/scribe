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

import { CurrentDeviceEndpoint } from "@scribe/host/api/public/admin/src/user/account/devices/current.ts";
import { ListDevicesEndpoint } from "@scribe/host/api/public/admin/src/user/account/devices/list.ts";
import { RevokeDeviceEndpoint } from "@scribe/host/api/public/admin/src/user/account/devices/revoke.ts";
import { SignOutEndpoint } from "@scribe/host/api/public/admin/src/user/account/sign-out.ts";
import { UpdatePasswordEndpoint } from "@scribe/host/api/public/admin/src/user/account/update/password.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { goTrueSession, installGoTrueMock } from "@scribe/host/dependencies/security/auth/testing/gotrue.ts";
import { callEndpoint } from "@scribe/core/testing/kernel/endpoint.ts";
import { fakeDevice } from "@scribe/core/testing/runtime/device.ts";
import { assertEquals } from "@std/assert";

const ADMIN_ID = "admin-1";
const ADMIN_EMAIL = "admin@example.com";
const CURRENT = "CurrentPass1";
const STRONG = "NewPassw0rd";

const IDENTITY = {
  id: ADMIN_ID,
  email: ADMIN_EMAIL,
  rules: { role: "owner", permissions: [] },
};

function signedIn(extra: Record<string, unknown> = {}) {
  return { identity: IDENTITY, device: fakeDevice(), ...extra };
}

function adminUsers() {
  return [{ admin_id: ADMIN_ID, email: ADMIN_EMAIL, phone: null }];
}

function deviceRows() {
  return [
    {
      id: "row-1",
      admin_id: ADMIN_ID,
      device_id: "device-1",
      hash: "hash-1",
      trusted_at: Date.now(),
    },
    {
      id: "row-2",
      admin_id: ADMIN_ID,
      device_id: "device-2",
      hash: "hash-2",
      trusted_at: Date.now(),
    },
  ];
}

// --- devices -----------------------------------------------------------------

Deno.test("GET /user/account/devices: lists the admin's own devices", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__admin_users: adminUsers(),
    internal_t__admin_users_devices: deviceRows(),
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
  const rest = installRestMock({
    internal_t__admin_users: adminUsers(),
    internal_t__admin_users_devices: deviceRows(),
  });
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

Deno.test(
  "GET /user/account/devices: a signed-in app user is not an admin",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: deviceRows(),
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => ListDevicesEndpoint.handle(),
        {},
        {
          method: "GET",
          device: fakeDevice(),
          identity: { id: "user-1", email: "u1@example.com" },
        },
      );

      assertEquals(
        res.status,
        401,
        "Caller.Admin must reject a plain session identity, not just an absent one",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "GET /user/account/devices/current: resolves the device carrying the request",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: deviceRows(),
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => CurrentDeviceEndpoint.handle(),
        {},
        signedIn({ method: "GET" }),
      );

      assertEquals(res.status, 200);
      assertEquals(
        (res.body.data as Record<string, unknown>).device_id,
        "device-1",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "GET /user/account/devices/current: an unknown device is a 404",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: deviceRows(),
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => CurrentDeviceEndpoint.handle(),
        {},
        signedIn({
          method: "GET",
          device: fakeDevice({ device_id: "device-unknown" }),
        }),
      );

      assertEquals(res.status, 404);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test("DELETE /user/account/devices/:id: revokes another device", async () => {
  const gotrue = installGoTrueMock({});
  const rest = installRestMock({
    internal_t__admin_users: adminUsers(),
    internal_t__admin_users_devices: deviceRows(),
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => RevokeDeviceEndpoint.handle("device-2"),
      {},
      signedIn({ method: "DELETE" }),
    );

    assertEquals(res.status, 200);
    assertEquals(rest.rows("internal_t__admin_users_devices").length, 1);
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test(
  "DELETE /user/account/devices/:id: the current device cannot be revoked this way",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: deviceRows(),
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
        rest.rows("internal_t__admin_users_devices").length,
        2,
        "revoking your own device would sign you out sideways: sign-out is the right verb",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "DELETE /user/account/devices/:id: a device owned by another admin is a 404",
  async () => {
    const gotrue = installGoTrueMock({});
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: [
        {
          id: "row-9",
          admin_id: "admin-9",
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
        rest.rows("internal_t__admin_users_devices").length,
        1,
        "another admin's device must survive",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

// --- sign-out ----------------------------------------------------------------

Deno.test("POST /user/account/sign-out: ends the session of the current device", async () => {
  const gotrue = installGoTrueMock({
    "POST /logout*": () => ({ status: 204 }),
  });
  const rest = installRestMock({
    internal_t__admin_users: adminUsers(),
    internal_t__admin_users_devices: deviceRows(),
  });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(
      () => SignOutEndpoint.handle(),
      {},
      signedIn(),
    );

    assertEquals(res.status, 200);
    assertEquals(
      rest.rows("internal_t__admin_users_devices").length,
      2,
      "signing out ends the session but must not delete the device row: it stays a known device",
    );
  } finally {
    env.restore();
    rest.restore();
    gotrue.restore();
  }
});

Deno.test("POST /user/account/sign-out: an anonymous caller is refused", async () => {
  const gotrue = installGoTrueMock({ "POST /logout*": () => ({ status: 204 }) });
  const rest = installRestMock({ internal_t__admin_users: adminUsers() });
  const env = installAuthEnv();

  try {
    const res = await callEndpoint(() => SignOutEndpoint.handle(), {}, {
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

// --- update/password ----------------------------------------------------------

Deno.test(
  "POST /user/account/update/password: the current password is re-checked against gotrue",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "PUT /admin/users/*": () => ({ status: 200, body: { id: ADMIN_ID } }),
      "POST /logout*": () => ({ status: 204 }),
    });
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: deviceRows(),
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => UpdatePasswordEndpoint.handle(),
        {
          current_password: CURRENT,
          new_password: STRONG,
          confirm_new_password: STRONG,
        },
        signedIn(),
      );

      assertEquals(res.status, 200);
      assertEquals(
        gotrue.called("PUT", `/admin/users/${ADMIN_ID}`),
        1,
        "the new password must land in gotrue, not only in our tables",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /user/account/update/password: a wrong current password is refused",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 400, body: {} }),
      "PUT /admin/users/*": () => ({ status: 200, body: { id: ADMIN_ID } }),
    });
    const rest = installRestMock({
      internal_t__admin_users: adminUsers(),
      internal_t__admin_users_devices: deviceRows(),
    });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => UpdatePasswordEndpoint.handle(),
        {
          current_password: "WrongPass1",
          new_password: STRONG,
          confirm_new_password: STRONG,
        },
        signedIn(),
      );

      assertEquals(res.status, 400);
      assertEquals(res.body.code, "invalid_current_password");
      assertEquals(
        gotrue.called("PUT", `/admin/users/${ADMIN_ID}`),
        0,
        "holding a session is not enough: without the current password nothing may be written",
      );
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /user/account/update/password: mismatched confirmation never reaches gotrue",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "PUT /admin/users/*": () => ({ status: 200, body: { id: ADMIN_ID } }),
    });
    const rest = installRestMock({ internal_t__admin_users: adminUsers() });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => UpdatePasswordEndpoint.handle(),
        {
          current_password: CURRENT,
          new_password: STRONG,
          confirm_new_password: "SomethingElse1",
        },
        signedIn(),
      );

      assertEquals(res.status, 400);
      assertEquals(res.body.code, "passwords_do_not_match");
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /user/account/update/password: reusing the current password is refused",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "PUT /admin/users/*": () => ({ status: 200, body: { id: ADMIN_ID } }),
    });
    const rest = installRestMock({ internal_t__admin_users: adminUsers() });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => UpdatePasswordEndpoint.handle(),
        {
          current_password: CURRENT,
          new_password: CURRENT,
          confirm_new_password: CURRENT,
        },
        signedIn(),
      );

      assertEquals(res.status, 400);
      assertEquals(res.body.code, "same_as_current_password");
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);

Deno.test(
  "POST /user/account/update/password: an anonymous caller is refused",
  async () => {
    const gotrue = installGoTrueMock({
      "POST /token*": () => ({ status: 200, body: goTrueSession() }),
      "PUT /admin/users/*": () => ({ status: 200, body: { id: ADMIN_ID } }),
    });
    const rest = installRestMock({ internal_t__admin_users: adminUsers() });
    const env = installAuthEnv();

    try {
      const res = await callEndpoint(
        () => UpdatePasswordEndpoint.handle(),
        {
          current_password: CURRENT,
          new_password: STRONG,
          confirm_new_password: STRONG,
        },
        { device: fakeDevice() },
      );

      assertEquals(res.status, 401);
      assertEquals(gotrue.calls.length, 0);
    } finally {
      env.restore();
      rest.restore();
      gotrue.restore();
    }
  },
);
