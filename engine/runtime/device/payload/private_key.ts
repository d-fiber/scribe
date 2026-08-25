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

import type { Future } from "@scribe/alchemy";
import { deviceSettings } from "@scribe/runtime/support/settings/device.ts";

const PKCS8_X25519_HEADER = new Uint8Array([
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

const HEX_32_BYTES = /^[0-9a-fA-F]{64}$/;

export class DeviceKeyError extends Error {}

let imported: Future<CryptoKey> | null = null;

export function devicePayloadPrivateKey(): Future<CryptoKey> {
  return (imported ??= importPrivateKey());
}

async function importPrivateKey(): Future<CryptoKey> {
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
