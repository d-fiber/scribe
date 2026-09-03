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
import { DEVICE_PAYLOAD_MAX_AGE_MS, DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS } from "./freshness.ts";
import { PlaintextCache } from "./plaintext_cache.ts";
import { devicePayloadPrivateKey } from "./private_key.ts";

const EPHEMERAL_KEY_BYTES = 32;
const NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

const HKDF_INFO = new TextEncoder().encode("device-payload-v1");

const PLAINTEXT_TTL_MS = DEVICE_PAYLOAD_MAX_AGE_MS +
  DEVICE_PAYLOAD_MAX_FUTURE_SKEW_MS;

const plaintexts = new PlaintextCache(PLAINTEXT_TTL_MS);

interface SealedBox {
  readonly ephemeralPublicKey: Uint8Array<ArrayBuffer>;
  readonly nonce: Uint8Array<ArrayBuffer>;
  readonly cipherWithTag: Uint8Array<ArrayBuffer>;
}

/**
 * Decrypts a device's sealed payload into the JSON object it encoded.
 *
 * @remarks
 * A device is expected to encrypt the same payload again on every request within its own freshness
 * window, since it has no way to know a previous call already decoded it: the plaintext cache is
 * what keeps a device that calls repeatedly from costing an X25519 exchange and an AES-GCM
 * decryption on every one of those calls.
 */
export class DevicePayloadCipher {
  /**
   * Opens `encrypted`, a sealed box, and parses the plaintext as JSON.
   *
   * @remarks
   * Answers `null` rather than throwing whenever the box cannot be opened or the plaintext is not
   * valid JSON, since a malformed device payload is refused the same way a missing one is: by the
   * caller getting nothing to work with. Successful decryptions are cached, so a payload replayed
   * inside the plaintext cache's TTL is not decrypted twice.
   */
  static async decrypt(encrypted: string): Future<unknown | null> {
    const cached = plaintexts.lookup(encrypted);
    if (cached !== undefined) return objectFrom(cached);

    const plaintext = await decipher(encrypted);
    plaintexts.remember(encrypted, plaintext);
    return objectFrom(plaintext);
  }

  /** How many decrypted device payloads the plaintext cache currently holds. */
  static get cachedPlaintexts(): number {
    return plaintexts.size;
  }
}

function objectFrom(plaintext: string | null): unknown | null {
  if (plaintext === null) return null;

  try {
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}

async function decipher(encrypted: string): Future<string | null> {
  const sealed = openSealedBox(encrypted);
  if (sealed === null) return null;

  try {
    const aesKey = await deriveAesKey(sealed.ephemeralPublicKey);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: sealed.nonce },
      aesKey,
      sealed.cipherWithTag,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
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
): Future<CryptoKey> {
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
