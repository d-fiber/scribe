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

export class EdgeConfig {
  readonly functionsRoot: string;
  readonly verifyJwt: boolean;
  readonly jwtSecret: string | undefined;
  readonly authUrl: string | undefined;
  readonly memoryLimitMb: number;
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

  static fromEnvironment(): EdgeConfig {
    return new EdgeConfig({
      functionsRoot: "/home/deno/functions",
      verifyJwt: Deno.env.get("VERIFY_JWT") === "true",
      jwtSecret: Deno.env.get("JWT_SECRET"),
      authUrl: Deno.env.get("SUPABASE_AUTH_INTERNAL_URL"),
      memoryLimitMb: 150,
      workerTimeoutMs: 60_000,
    });
  }

  get importMapPath(): string {
    return `${this.functionsRoot}/deno.json`;
  }
}
