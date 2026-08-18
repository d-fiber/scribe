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

import { database } from "@scribe/foundation/src/database/database.ts";
import type { AccountRole } from "@scribe/core/contracts/account.ts";
import { Env } from "@scribe/host/env.ts";
import { fromHex, sha256Hex, toHex } from "@scribe/core/runtime/support/crypto/hash.ts";

export const VPN_ACCESS_PURPOSE = "vpn-access";

const LEGACY_PURPOSE = "sign-in";
const TTL_MS = 4 * 60 * 60 * 1000;

export const MAX_PENDING_TOKEN_CHARS = 2048;

export interface PendingTokenPayload {
  readonly identifier: string;
  readonly role: AccountRole;
  readonly deviceId: string | null;
}

export class PendingToken {
  readonly #hmacKey: Promise<CryptoKey>;

  constructor() {
    this.#hmacKey = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(Env.PENDING_TOKEN_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }

  get ttlMs(): number {
    return TTL_MS;
  }

  async issue(
    identifier: string,
    role: AccountRole,
    deviceId: string | null,
  ): Promise<string | null> {
    const expiresAt = Date.now() + this.ttlMs;
    const token = await this.#sign(identifier, role, deviceId, expiresAt);

    const saved = await database.internal_t__otp_pending_tokens().insert({
      token_hash: await sha256Hex(token),
      expires_at: expiresAt,
    });

    return saved ? token : null;
  }

  async #sign(
    identifier: string,
    role: AccountRole,
    deviceId: string | null,
    expiresAt: number,
  ): Promise<string> {
    const key = await this.#hmacKey;
    const utf8Bytes = new TextEncoder().encode(
      JSON.stringify({
        identifier,
        role,
        deviceId,
        purpose: VPN_ACCESS_PURPOSE,
        jti: crypto.randomUUID(),
        exp: expiresAt,
      }),
    );
    let binary = "";
    for (const byte of utf8Bytes) binary += String.fromCharCode(byte);
    const payloadB64 = btoa(binary);
    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payloadB64),
    );
    return `${payloadB64}.${toHex(sigBuffer)}`;
  }

  async payload(token: string): Promise<PendingTokenPayload | null> {
    try {
      if (!token || token.length > MAX_PENDING_TOKEN_CHARS) return null;

      const dotIdx = token.indexOf(".");
      if (dotIdx === -1) return null;
      const payloadB64 = token.slice(0, dotIdx);
      const sigHex = token.slice(dotIdx + 1);

      const key = await this.#hmacKey;
      const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        fromHex(sigHex),
        new TextEncoder().encode(payloadB64),
      );
      if (!valid) return null;

      const utf8Bytes = Uint8Array.from(
        atob(payloadB64),
        (c) => c.charCodeAt(0),
      );
      const { identifier, role, deviceId, purpose, exp } = JSON.parse(
        new TextDecoder().decode(utf8Bytes),
      ) as {
        identifier: string;
        role: AccountRole;
        deviceId: string | null;
        purpose?: string;
        exp: number;
      };
      if (Date.now() > exp) return null;
      if (!identifier || !role) return null;
      if ((purpose ?? LEGACY_PURPOSE) !== VPN_ACCESS_PURPOSE) return null;

      return { identifier, role, deviceId: deviceId ?? null };
    } catch {
      return null;
    }
  }

  async exists(token: string): Promise<boolean> {
    const hash = await sha256Hex(token);
    const data = await database
      .internal_t__otp_pending_tokens()
      .select((s) => ({ token_hash: s.token_hash }))
      .where((f) => [f.token_hash.eq(hash), f.expires_at.gt(Date.now())])
      .getOne();
    return data !== null;
  }

  async consume(token: string): Promise<boolean> {
    const hash = await sha256Hex(token);
    const deleted = await database
      .internal_t__otp_pending_tokens()
      .where((f) => [f.token_hash.eq(hash), f.expires_at.gt(Date.now())])
      .deleteOne((s) => ({ token_hash: s.token_hash }));
    return deleted !== null;
  }
}
