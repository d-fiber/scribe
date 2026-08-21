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
