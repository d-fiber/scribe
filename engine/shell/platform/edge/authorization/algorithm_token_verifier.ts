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
import { decodeProtectedHeader } from "jose";
import type { TokenVerifier } from "./token_verifier.ts";

/**
 * The {@link TokenVerifier} `factory.ts` builds for a deployment: one entry point over however
 * many schemes it has configured.
 *
 * @remarks
 * Reading the token's own `alg` header only ever picks which wrapped verifier answers, it never
 * decides whether the token is valid: each wrapped verifier still hands its own fixed algorithm
 * list to jose, so a token whose header lies about its algorithm is routed nowhere useful rather
 * than verified against the wrong key. That split is what lets this class combine a symmetric and
 * an asymmetric verifier without either one having to trust what the other configured.
 */
export class AlgorithmTokenVerifier implements TokenVerifier {
  readonly #byAlgorithm: ReadonlyMap<string, TokenVerifier>;

  constructor(verifiers: readonly TokenVerifier[]) {
    const byAlgorithm = new Map<string, TokenVerifier>();
    for (const verifier of verifiers) {
      for (const algorithm of verifier.algorithms) {
        byAlgorithm.set(algorithm, verifier);
      }
    }
    this.#byAlgorithm = byAlgorithm;
  }

  /**
   * Every algorithm at least one wrapped verifier accepts, in no particular order.
   *
   * @remarks
   * Answers only to satisfy the {@link TokenVerifier} interface this class itself implements;
   * nothing here reads it back. The routing that matters is `#byAlgorithm`, filled from the same
   * wrapped verifiers in the constructor.
   */
  get algorithms(): readonly string[] {
    return [...this.#byAlgorithm.keys()];
  }

  /**
   * The {@link TokenVerifier.verify} implementation.
   *
   * @remarks
   * Refuses outright, without asking any wrapped verifier, when the token's header names an
   * algorithm nothing was configured for: a deployment that only turned on symmetric verification
   * should not spend a network round trip checking an asymmetric token against a JWKS that was
   * never fetched for that purpose.
   */
  verify(token: string): Future<boolean> {
    const verifier = this.#verifierFor(token);
    return verifier === null ? Promise.resolve(false) : verifier.verify(token);
  }

  #verifierFor(token: string): TokenVerifier | null {
    try {
      const { alg } = decodeProtectedHeader(token);
      return alg === undefined ? null : this.#byAlgorithm.get(alg) ?? null;
    } catch {
      return null;
    }
  }
}
