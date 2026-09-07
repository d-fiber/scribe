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

import { INTERNAL_SERVICES } from "@scribe/kernel/http/routing/internal_services.ts";
import { AlgorithmTokenVerifier } from "./authorization/algorithm_token_verifier.ts";
import { HmacTokenVerifier } from "./authorization/hmac_token_verifier.ts";
import { JwksTokenVerifier } from "./authorization/jwks_token_verifier.ts";
import { JwtRequestAuthorizer } from "./authorization/jwt_request_authorizer.ts";
import { OpenRequestAuthorizer, type RequestAuthorizer } from "./authorization/request_authorizer.ts";
import type { TokenVerifier } from "./authorization/token_verifier.ts";
import { EdgeWorkerDispatcher } from "./dispatch/edge_worker_dispatcher.ts";
import { EdgeConfig } from "./config.ts";
import { EdgeFunctionsRuntime } from "./runtime.ts";
import { SupabaseEdgePlatform } from "./platform.ts";
import { DirectoryServiceResolver } from "./services/directory_service_resolver.ts";

/**
 * The {@link TokenVerifier} this deployment verifies a bearer token with, one algorithm family per
 * key material `config` actually names.
 *
 * @remarks
 * Each candidate's own static factory answers `null` when its key material is missing, so a
 * deployment with no JWKS address simply narrows to the HMAC verifier instead of failing here.
 */
function tokenVerifier(config: EdgeConfig): TokenVerifier {
  const candidates: readonly (TokenVerifier | null)[] = [
    HmacTokenVerifier.fromSecret(config.jwtSecret),
    JwksTokenVerifier.fromAuthUrl(config.authUrl),
  ];

  return new AlgorithmTokenVerifier(
    candidates.filter((verifier): verifier is TokenVerifier => verifier !== null),
  );
}

/** The {@link RequestAuthorizer} this deployment authorizes a request with, chosen once from `config.verifyJwt`. */
function requestAuthorizer(config: EdgeConfig): RequestAuthorizer {
  if (!config.verifyJwt) return new OpenRequestAuthorizer();
  return new JwtRequestAuthorizer(tokenVerifier(config), INTERNAL_SERVICES);
}

/**
 * The {@link EdgeFunctionsRuntime} this deployment boots, its three collaborators built from
 * `config`.
 *
 * @remarks
 * This is the composition root for the edge platform: the one place that decides which
 * `TokenVerifier`, `RequestAuthorizer` and `WorkerDispatcher` a deployment gets, so that
 * `EdgeFunctionsRuntime` itself never has to know how any of the three were chosen.
 */
export function createEdgeRuntime(
  config: EdgeConfig = EdgeConfig.fromEnvironment(),
): EdgeFunctionsRuntime {
  return new EdgeFunctionsRuntime({
    resolver: new DirectoryServiceResolver(config.functionsRoot),
    authorizer: requestAuthorizer(config),
    dispatcher: new EdgeWorkerDispatcher(new SupabaseEdgePlatform(), {
      memoryLimitMb: config.memoryLimitMb,
      workerTimeoutMs: config.workerTimeoutMs,
      importMapPath: config.importMapPath,
    }),
  });
}
