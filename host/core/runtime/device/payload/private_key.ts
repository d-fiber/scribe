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

import { deviceSettings } from "@scribe/core/runtime/support/settings/device.ts";

const PKCS8_X25519_HEADER = new Uint8Array([
  0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04,
  0x22, 0x04, 0x20,
]);

const HEX_32_BYTES = /^[0-9a-fA-F]{64}$/;

export class DeviceKeyError extends Error {}

let imported: Promise<CryptoKey> | null = null;

export function devicePayloadPrivateKey(): Promise<CryptoKey> {
  return (imported ??= importPrivateKey());
}

async function importPrivateKey(): Promise<CryptoKey> {
  const hex = readKeyHex();
  const raw = (hex.match(/.{2}/g) ?? []).map((byte) => parseInt(byte, 16));

  const pkcs8 = new Uint8Array(PKCS8_X25519_HEADER.length + raw.length);
  pkcs8.set(PKCS8_X25519_HEADER);
  pkcs8.set(raw, PKCS8_X25519_HEADER.length);

  return await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "X25519" },
    false,
    ["deriveKey", "deriveBits"],
  );
}

function readKeyHex(): string {
  const hex = deviceSettings.get().payloadPrivateKeyHex;
  if (HEX_32_BYTES.test(hex)) return hex;

  const error = new DeviceKeyError(
    "DEVICE_PAYLOAD_PRIVATE_KEY must be a 32-byte hex string",
  );
  console.error(
    "[device-payload] server key unusable, every device payload will be rejected:",
    error.message,
  );
  throw error;
}
