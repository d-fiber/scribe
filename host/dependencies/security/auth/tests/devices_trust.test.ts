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

import { sha256Hex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { DevicesClient } from "@scribe/host/dependencies/security/auth/src/user/devices/devices.ts";
import { fakeDevice, withRequest } from "@scribe/core/testing/runtime/device.ts";
import { installRestMock } from "@scribe/host/tests/mocks/dependencies/database/rest/install_rest.ts";
import { installAuthEnv } from "@scribe/host/dependencies/security/auth/testing/env.ts";
import { assertEquals } from "@std/assert";

const TOKEN = "b".repeat(128);
const WEEK = 7 * 24 * 60 * 60 * 1000;

async function seedDevice(overrides: Record<string, unknown> = {}) {
  return {
    internal_t__app_user_devices: [{
      id: "row-1",
      user_id: "user-1",
      device_id: "device-1",
      hash: await sha256Hex(TOKEN),
      trusted_at: Date.now(),
      ...overrides,
    }],
  };
}

async function isTrust(
  seed: Record<string, unknown[]>,
  token: string | undefined,
): Promise<boolean> {
  const env = installAuthEnv();
  const rest = installRestMock(seed as never);
  try {
    return await withRequest(
      fakeDevice({ device_token: token }),
      () => new DevicesClient().isTrust("device-1", "user-1"),
    );
  } finally {
    rest.restore();
    env.restore();
  }
}

Deno.test("known device, correct token, within the window: trusted", async () => {
  assertEquals(await isTrust(await seedDevice(), TOKEN), true);
});

Deno.test("missing device token: never trusted", async () => {
  assertEquals(await isTrust(await seedDevice(), undefined), false);
});

Deno.test("wrong device token: refused", async () => {
  assertEquals(await isTrust(await seedDevice(), "c".repeat(128)), false);
});

Deno.test("trust expired beyond 7 days", async () => {
  const seed = await seedDevice({ trusted_at: Date.now() - WEEK - 1000 });
  assertEquals(await isTrust(seed, TOKEN), false);
});

Deno.test("trust still valid just under 7 days", async () => {
  const seed = await seedDevice({ trusted_at: Date.now() - WEEK + 60_000 });
  assertEquals(await isTrust(seed, TOKEN), true);
});

Deno.test("null hash in the database: refused", async () => {
  const seed = await seedDevice({ hash: null });
  assertEquals(await isTrust(seed, TOKEN), false);
});

Deno.test("unknown device: refused", async () => {
  assertEquals(await isTrust({ internal_t__app_user_devices: [] }, TOKEN), false);
});

Deno.test("a device belonging to another account is not trusted", async () => {
  const seed = await seedDevice({ user_id: "user-2" });
  assertEquals(await isTrust(seed, TOKEN), false);
});
