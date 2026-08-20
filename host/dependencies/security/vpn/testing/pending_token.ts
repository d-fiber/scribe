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

import "@scribe/core/testing/settings.ts";
// Forge a vpn-access token the way PendingToken.issue() signs one, but without
// the database round-trip: a test needs the raw token *before* it can build the
// rest mock seed that carries its hash. `tests/pending_token.test.ts` pins this
// forge against the real implementation, so a change to the signing format
// fails there instead of silently making every fixture unverifiable.
//
// `purpose` is a free string on purpose: a test that checks a foreign-purpose
// token is refused must be able to sign one this module can never produce.

import type { AccountRole } from "@scribe/auth/contracts/role.ts";
import { PendingTokenPurpose } from "@scribe/auth/src/pending_token.ts";
import { toHex } from "@scribe/core/runtime/support/crypto/hash.ts";
import { Env } from "@scribe/host/env.ts";

export interface ForgedTokenOptions {
  readonly purpose?: string;
  readonly deviceId?: string | null;
  readonly expiresAt?: number;
}

function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(Env.PENDING_TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function forgeToken(
  identifier: string,
  role: AccountRole,
  options: ForgedTokenOptions = {},
): Promise<string> {
  const utf8Bytes = new TextEncoder().encode(
    JSON.stringify({
      identifier,
      role,
      deviceId: options.deviceId ?? null,
      purpose: options.purpose ?? PendingTokenPurpose.VpnAccess,
      jti: crypto.randomUUID(),
      exp: options.expiresAt ?? Date.now() + 10 * 60 * 1000,
    }),
  );

  let binary = "";
  for (const byte of utf8Bytes) binary += String.fromCharCode(byte);
  const payloadB64 = btoa(binary);

  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(payloadB64),
  );

  return `${payloadB64}.${toHex(signature)}`;
}
