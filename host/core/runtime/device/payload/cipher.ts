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

import { devicePayloadPrivateKey } from "./private_key.ts";

const EPHEMERAL_KEY_BYTES = 32;
const NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

const HKDF_INFO = new TextEncoder().encode("device-payload-v1");

interface SealedBox {
  readonly ephemeralPublicKey: Uint8Array<ArrayBuffer>;
  readonly nonce: Uint8Array<ArrayBuffer>;
  readonly cipherWithTag: Uint8Array<ArrayBuffer>;
}

export class DevicePayloadCipher {
  static async decrypt(encrypted: string): Promise<unknown | null> {
    const sealed = openSealedBox(encrypted);
    if (sealed === null) return null;

    try {
      const aesKey = await deriveAesKey(sealed.ephemeralPublicKey);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: sealed.nonce },
        aesKey,
        sealed.cipherWithTag,
      );
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch {
      return null;
    }
  }
}

function openSealedBox(encrypted: string): SealedBox | null {
  const bytes = base64Decode(encrypted);
  if (bytes === null) return null;
  if (bytes.length < EPHEMERAL_KEY_BYTES + NONCE_BYTES + GCM_TAG_BYTES) {
    return null;
  }

  const nonceAt = EPHEMERAL_KEY_BYTES;
  const cipherAt = nonceAt + NONCE_BYTES;

  return {
    ephemeralPublicKey: bytes.slice(0, EPHEMERAL_KEY_BYTES),
    nonce: bytes.slice(nonceAt, cipherAt),
    cipherWithTag: bytes.slice(cipherAt),
  };
}

function base64Decode(encoded: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function deriveAesKey(
  ephemeralPublicKey: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const imported = await crypto.subtle.importKey(
    "raw",
    ephemeralPublicKey,
    { name: "X25519" },
    false,
    [],
  );

  const sharedBits = await crypto.subtle.deriveBits(
    { name: "X25519", public: imported },
    await devicePayloadPrivateKey(),
    256,
  );

  const hkdfKey = await crypto.subtle.importKey(
    "raw",
    sharedBits,
    "HKDF",
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: HKDF_INFO },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}
