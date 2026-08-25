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

import { utf8 } from "@scribe/alchemy";
import type { Future } from "@scribe/alchemy";
import { identitySettings } from "@scribe/runtime/support/settings/identity.ts";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import type { JWTPayload, JWTVerifyResult } from "jose";

const _SYMMETRIC_ALGS = ["HS256"];
const _ASYMMETRIC_ALGS = ["ES256", "RS256"];
const _AUDIENCE = "authenticated";
const _END_USER_ROLE = "authenticated";

function _isEndUserToken(payload: JWTPayload): boolean {
  const { sub, role } = payload as JWTPayload & { role?: unknown };
  if (typeof sub !== "string" || sub.length === 0) return false;
  return role === _END_USER_ROLE;
}

type RemoteKeySet = ReturnType<typeof createRemoteJWKSet>;

let remoteKeys: RemoteKeySet | null = null;

function remoteKeySet(): RemoteKeySet | null {
  if (remoteKeys !== null) return remoteKeys;

  try {
    remoteKeys = createRemoteJWKSet(
      new URL("/.well-known/jwks.json", identitySettings.get().authUrl),
    );
    return remoteKeys;
  } catch (error) {
    console.error(
      "[jwt-verifier] no JWKS endpoint, asymmetric tokens will be refused:",
      error,
    );
    return null;
  }
}

type Verification = (jwt: string) => Future<JWTVerifyResult>;

let hmacSecret: string | null = null;
let hmacKey: Future<CryptoKey> | null = null;

/**
 * The shared secret as a `CryptoKey`, imported once per secret.
 *
 * Handing jose the raw bytes makes it import the key again on every single
 * verification, which measured as a fifth of the whole HS256 cost. The import
 * is keyed on the secret itself so that swapping it, which only tests do,
 * still takes effect.
 */
function symmetricKey(secret: string): Future<CryptoKey> {
  if (secret !== hmacSecret || hmacKey === null) {
    hmacSecret = secret;
    hmacKey = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
  }

  return hmacKey;
}

function verificationFor(alg: string | undefined): Verification | null {
  if (alg === undefined) return null;

  if (_SYMMETRIC_ALGS.includes(alg)) {
    const secret = identitySettings.get().jwtSecret;
    if (!secret) return null;

    return async (jwt) =>
      jwtVerify(jwt, await symmetricKey(secret), {
        audience: _AUDIENCE,
        algorithms: _SYMMETRIC_ALGS,
      });
  }

  if (_ASYMMETRIC_ALGS.includes(alg)) {
    const keys = remoteKeySet();
    if (keys === null) return null;

    return (jwt) =>
      jwtVerify(jwt, keys, {
        audience: _AUDIENCE,
        algorithms: _ASYMMETRIC_ALGS,
      });
  }

  return null;
}

export class JwtVerifier {
  static async verify(jwt: string): Future<JWTPayload | null> {
    try {
      const verification = verificationFor(decodeProtectedHeader(jwt).alg);
      if (verification === null) return null;

      const { payload } = await verification(jwt);
      return _isEndUserToken(payload) ? payload : null;
    } catch {
      return null;
    }
  }
}
