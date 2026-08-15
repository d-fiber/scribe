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

import { ClientType, DeviceCategory, DeviceOs, DeviceThemeMode, Localization } from "@scribe/core/contracts/enums.ts";
import { Env } from "@scribe/host/env.ts";
import { decryptRequestDevice } from "@scribe/core/runtime/device/device.ts";
import {
  DEVICE_PAYLOAD_MAX_AGE_MS,
  DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS,
} from "@scribe/core/runtime/device/payload/freshness.ts";
import { DevicePayloadValidator } from "@scribe/core/runtime/device/payload/validator.ts";
import { installValkeryMock } from "@scribe/core/testing/runtime/redis.ts";
import { assert, assertEquals } from "@std/assert";

const BINDING = "user-1";

const _PKCS8_X25519_HEADER = new Uint8Array([
  0x30,
  0x2e,
  0x02,
  0x01,
  0x00,
  0x30,
  0x05,
  0x06,
  0x03,
  0x2b,
  0x65,
  0x6e,
  0x04,
  0x22,
  0x04,
  0x20,
]);

function nominalPayload(overrides: Record<string, unknown> = {}) {
  return {
    device_id: "device-1",
    client: ClientType.APP,
    os: DeviceOs.IOS,
    model: "iPhone15,2",
    is_physical_device: true,
    device_category: DeviceCategory.PHONE,
    localization: Localization.FRENCH,
    theme_mode: DeviceThemeMode.SYSTEM,
    binding: BINDING,
    iat: Date.now(),
    ...overrides,
  };
}

async function serverPublicKey(): Promise<CryptoKey> {
  const raw = (Env.DEVICE_PAYLOAD_PRIVATE_KEY.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16));
  const pkcs8 = new Uint8Array(_PKCS8_X25519_HEADER.length + raw.length);
  pkcs8.set(_PKCS8_X25519_HEADER);
  pkcs8.set(raw, _PKCS8_X25519_HEADER.length);

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "X25519" },
    true,
    ["deriveBits"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);

  return await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, crv: jwk.crv, x: jwk.x },
    { name: "X25519" },
    true,
    [],
  );
}

async function seal(payload: unknown): Promise<string> {
  const ephemeral = await crypto.subtle.generateKey({ name: "X25519" }, true, [
    "deriveBits",
  ]) as CryptoKeyPair;

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "X25519", public: await serverPublicKey() },
    ephemeral.privateKey,
    256,
  );

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"],
  );
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("device-payload-v1"),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      aesKey,
      new TextEncoder().encode(JSON.stringify(payload)),
    ),
  );

  const ephemeralPub = new Uint8Array(
    await crypto.subtle.exportKey("raw", ephemeral.publicKey),
  );

  const bytes = new Uint8Array(
    ephemeralPub.length + nonce.length + sealed.length,
  );
  bytes.set(ephemeralPub);
  bytes.set(nonce, ephemeralPub.length);
  bytes.set(sealed, ephemeralPub.length + nonce.length);

  return btoa(String.fromCharCode(...bytes));
}

Deno.test("cipher: a sealed payload round-trips through the real key", async () => {
  const kv = installValkeryMock();
  try {
    const device = await decryptRequestDevice(
      await seal(nominalPayload()),
      BINDING,
    );

    assert(device, "a well-formed payload must decrypt");
    assertEquals(device.device_id, "device-1");
    assertEquals(device.os, DeviceOs.IOS);
  } finally {
    kv.restore();
  }
});

Deno.test("cipher: a payload sealed for another binding is refused", async () => {
  const kv = installValkeryMock();
  try {
    const sealed = await seal(nominalPayload({ binding: "user-2" }));
    assertEquals(await decryptRequestDevice(sealed, BINDING), null);
  } finally {
    kv.restore();
  }
});

Deno.test("cipher: a tampered ciphertext never decrypts", async () => {
  const kv = installValkeryMock();
  try {
    const sealed = await seal(nominalPayload());
    const bytes = Uint8Array.from(atob(sealed), (c) => c.charCodeAt(0));
    bytes[bytes.length - 1] ^= 0xff;
    const tampered = btoa(String.fromCharCode(...bytes));

    assertEquals(await decryptRequestDevice(tampered, BINDING), null);
  } finally {
    kv.restore();
  }
});

Deno.test("cipher: garbage never throws, it just yields nothing", async () => {
  const kv = installValkeryMock();
  try {
    for (const bad of ["", "not-base64!!", btoa("too-short"), "x".repeat(200)]) {
      assertEquals(
        await decryptRequestDevice(bad, BINDING),
        null,
        `"${bad.slice(0, 16)}" must be refused`,
      );
    }
  } finally {
    kv.restore();
  }
});

Deno.test("nonce: a payload carrying a nonce is single-use", async () => {
  const kv = installValkeryMock();
  try {
    const sealed = await seal(
      nominalPayload({ nonce: "a".repeat(32) }),
    );

    assert(
      await decryptRequestDevice(sealed, BINDING),
      "the first presentation must be accepted",
    );
    assertEquals(
      await decryptRequestDevice(sealed, BINDING),
      null,
      "replaying the very same payload must be refused",
    );
  } finally {
    kv.restore();
  }
});

Deno.test("nonce: two payloads with distinct nonces both pass", async () => {
  const kv = installValkeryMock();
  try {
    const first = await seal(nominalPayload({ nonce: "b".repeat(32) }));
    const second = await seal(nominalPayload({ nonce: "c".repeat(32) }));

    assert(await decryptRequestDevice(first, BINDING));
    assert(await decryptRequestDevice(second, BINDING));
  } finally {
    kv.restore();
  }
});

Deno.test("nonce: a payload without a nonce stays replayable", async () => {
  const kv = installValkeryMock();
  try {
    const sealed = await seal(nominalPayload());

    assert(await decryptRequestDevice(sealed, BINDING));
    assert(
      await decryptRequestDevice(sealed, BINDING),
      "the legacy client contract must keep working until it emits nonces",
    );
  } finally {
    kv.restore();
  }
});

Deno.test("validator: the binding must match exactly", () => {
  assertEquals(
    DevicePayloadValidator.validate(nominalPayload(), "user-2"),
    null,
  );
  assertEquals(
    DevicePayloadValidator.validate(nominalPayload({ binding: "" }), BINDING),
    null,
  );
  assert(DevicePayloadValidator.validate(nominalPayload(), BINDING));
});

Deno.test("validator: a stale payload is refused", () => {
  const stale = nominalPayload({
    iat: Date.now() - DEVICE_PAYLOAD_MAX_AGE_MS - 1_000,
  });
  assertEquals(DevicePayloadValidator.validate(stale, BINDING), null);

  const fresh = nominalPayload({
    iat: Date.now() - DEVICE_PAYLOAD_MAX_AGE_MS + 5_000,
  });
  assert(DevicePayloadValidator.validate(fresh, BINDING));
});

Deno.test("validator: a payload dated in the future is refused", () => {
  const ahead = nominalPayload({
    iat: Date.now() + DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS + 5_000,
  });
  assertEquals(
    DevicePayloadValidator.validate(ahead, BINDING),
    null,
    "a client clock cannot buy itself a longer replay window",
  );

  const slightlyAhead = nominalPayload({ iat: Date.now() + 5_000 });
  assert(
    DevicePayloadValidator.validate(slightlyAhead, BINDING),
    "a small clock skew stays tolerated",
  );
});

Deno.test("validator: every enum field is closed", () => {
  const cases: Record<string, unknown>[] = [
    { client: "browser" },
    { os: "symbian" },
    { device_category: "fridge" },
    { localization: "klingon" },
    { theme_mode: "sepia" },
  ];

  for (const override of cases) {
    assertEquals(
      DevicePayloadValidator.validate(nominalPayload(override), BINDING),
      null,
      `${Object.keys(override)[0]} must reject an unknown value`,
    );
  }
});

Deno.test("validator: unbounded strings are refused", () => {
  const cases: Record<string, unknown>[] = [
    { device_id: "" },
    { device_id: "x".repeat(257) },
    { model: "" },
    { model: "x".repeat(256) },
    { app_version: "x".repeat(33) },
    { notification_token: "x".repeat(513) },
    { device_token: "x".repeat(129) },
    { nonce: "short" },
    { nonce: "x".repeat(129) },
  ];

  for (const override of cases) {
    assertEquals(
      DevicePayloadValidator.validate(nominalPayload(override), BINDING),
      null,
      `${Object.keys(override)[0]} must be bounded`,
    );
  }
});

Deno.test("validator: a missing required field is refused", () => {
  for (
    const field of [
      "device_id",
      "client",
      "os",
      "model",
      "is_physical_device",
      "device_category",
      "localization",
      "theme_mode",
    ]
  ) {
    const payload = nominalPayload();
    delete (payload as Record<string, unknown>)[field];

    assertEquals(
      DevicePayloadValidator.validate(payload, BINDING),
      null,
      `${field} is required`,
    );
  }
});

Deno.test("validator: a non-object is refused without throwing", () => {
  for (const raw of [null, undefined, 42, "payload", []]) {
    assertEquals(DevicePayloadValidator.validate(raw, BINDING), null);
  }
});
