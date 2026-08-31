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

import { environment } from "@scribe/runtime/scholium/env.ts";

/**
 * How the edge platform is configured for this deployment.
 *
 * @remarks
 * Read once, at boot, through {@link fromEnvironment}, rather than having each collaborator read
 * its own settings from the environment as it is built: a private constructor is what makes that
 * the only way to get one, so nothing downstream can end up with a value the environment changed
 * after boot.
 */
export class EdgeConfig {
  /** The directory on disk that holds the deployed functions, one subdirectory per service. */
  readonly functionsRoot: string;

  /** Whether a request must carry a JWT this platform can verify before it reaches a function. */
  readonly verifyJwt: boolean;

  /** The HMAC secret JWT verification signs against, when verification runs locally rather than against `authUrl`. */
  readonly jwtSecret: string | undefined;

  /** The internal address of the auth service a JWT is verified against, when verification is not local. */
  readonly authUrl: string | undefined;

  /** The memory ceiling given to each worker isolate, in megabytes. */
  readonly memoryLimitMb: number;

  /** How long a worker isolate has to answer a request before it is killed, in milliseconds. */
  readonly workerTimeoutMs: number;

  private constructor(values: {
    functionsRoot: string;
    verifyJwt: boolean;
    jwtSecret: string | undefined;
    authUrl: string | undefined;
    memoryLimitMb: number;
    workerTimeoutMs: number;
  }) {
    this.functionsRoot = values.functionsRoot;
    this.verifyJwt = values.verifyJwt;
    this.jwtSecret = values.jwtSecret;
    this.authUrl = values.authUrl;
    this.memoryLimitMb = values.memoryLimitMb;
    this.workerTimeoutMs = values.workerTimeoutMs;
  }

  /**
   * Reads this deployment's edge configuration from the environment.
   *
   * @remarks
   * `functionsRoot`, `memoryLimitMb` and `workerTimeoutMs` are fixed rather than read from a
   * variable, because they describe the container image and the platform's own isolate limits, not
   * a choice a deployment makes: nothing in this codebase runs the edge functions from anywhere
   * else, so a setting for them would be one more value to keep in sync with the image for no
   * deployment to ever actually change.
   */
  static fromEnvironment(): EdgeConfig {
    return new EdgeConfig({
      functionsRoot: "/home/deno/functions",
      verifyJwt: environment().get("VERIFY_JWT") === "true",
      jwtSecret: environment().get("JWT_SECRET"),
      authUrl: environment().get("AUTH_INTERNAL_URL"),
      memoryLimitMb: 150,
      workerTimeoutMs: 60_000,
    });
  }

  /** The functions root's own `deno.json`, read as the import map every worker isolate resolves against. */
  get importMapPath(): string {
    return `${this.functionsRoot}/deno.json`;
  }
}
