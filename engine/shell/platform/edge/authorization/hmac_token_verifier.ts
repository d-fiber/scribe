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
import { jwtVerify } from "jose";
import type { TokenVerifier } from "./token_verifier.ts";

export class HmacTokenVerifier implements TokenVerifier {
  /** The only algorithm this verifier accepts: the one an octet secret is valid for. */
  readonly algorithms = ["HS256"] as const;

  readonly #secret: Uint8Array;

  constructor(secret: string) {
    this.#secret = utf8.encode(secret);
  }

  static fromSecret(secret: string | undefined): HmacTokenVerifier | null {
    return secret ? new HmacTokenVerifier(secret) : null;
  }

  /**
   * Whether `token` was signed with this deployment's shared secret.
   *
   * @remarks
   * The algorithms are handed to jose rather than left to the key type. Without them a verifier
   * that says it takes HS256 took HS384 and HS512 as well, because an octet key fits all three,
   * and only the router in front of it happened to refuse them. A declaration nothing enforces is
   * the shape an algorithm confusion grows in.
   */
  async verify(token: string): Future<boolean> {
    try {
      await jwtVerify(token, this.#secret, { algorithms: [...this.algorithms] });
      return true;
    } catch {
      return false;
    }
  }
}
