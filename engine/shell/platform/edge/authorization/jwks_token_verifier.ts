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
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { TokenVerifier } from "./token_verifier.ts";

type KeySet = ReturnType<typeof createRemoteJWKSet>;

/**
 * The {@link TokenVerifier} for an asymmetric JWT, checked against the identity service's own published keys.
 *
 * @remarks
 * The keys are fetched over the network rather than configured as a secret, because an asymmetric
 * scheme is exactly the one where the verifier only ever needs the public half: the identity
 * service keeps the private key to itself and publishes the rest at a well-known URL, so rotating
 * it does not require pushing a new value to every deployment that verifies its tokens.
 */
export class JwksTokenVerifier implements TokenVerifier {
  /**
   * The algorithms this verifier accepts from the identity service's published keys.
   *
   * @remarks
   * Fixed to the two the identity service is known to sign with, not read from the JWKS response,
   * because a key set can carry a key of any algorithm and a verifier that accepted whatever the
   * fetched set happened to contain would trust a key the identity service never meant for signing
   * tokens at all.
   */
  readonly algorithms = ["ES256", "RS256"] as const;

  readonly #keys: KeySet;

  constructor(keys: KeySet) {
    this.#keys = keys;
  }

  /**
   * Builds a verifier that fetches its keys from `authUrl`'s `.well-known/jwks.json`, or `null`
   * when `authUrl` is unset or the endpoint cannot be constructed at all.
   *
   * @remarks
   * `null` rather than a verifier that always refuses, because the caller building the deployment's
   * `TokenVerifier` needs to tell "no identity service configured" apart from "configured, but every
   * token happens to be invalid": the first is a deployment that never asked for asymmetric
   * verification at all, and folding it into a verifier that always fails would make a missing
   * `authUrl` look identical to an outage.
   */
  static fromAuthUrl(authUrl: string | undefined): JwksTokenVerifier | null {
    if (!authUrl) return null;
    try {
      const keys = createRemoteJWKSet(
        new URL("/.well-known/jwks.json", authUrl),
      );
      return new JwksTokenVerifier(keys);
    } catch {
      return null;
    }
  }

  /**
   * Whether `token` was signed by a key the identity service publishes.
   *
   * @remarks
   * The algorithms are handed to jose rather than left to the key set to sort out. What this class
   * says it takes is what it must take: a declaration nothing enforces is the shape an algorithm
   * confusion grows in, and here nothing but the router in front happened to hold the line.
   */
  async verify(token: string): Future<boolean> {
    try {
      await jwtVerify(token, this.#keys, { algorithms: [...this.algorithms] });
      return true;
    } catch {
      return false;
    }
  }
}
