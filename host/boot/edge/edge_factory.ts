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

import { INTERNAL_SERVICES } from "@scribe/core/kernel/http/routing/internal_services.ts";
import { AlgorithmTokenVerifier } from "./authorization/algorithm_token_verifier.ts";
import { HmacTokenVerifier } from "./authorization/hmac_token_verifier.ts";
import { JwksTokenVerifier } from "./authorization/jwks_token_verifier.ts";
import { JwtRequestAuthorizer } from "./authorization/jwt_request_authorizer.ts";
import {
  OpenRequestAuthorizer,
  type RequestAuthorizer,
} from "./authorization/request_authorizer.ts";
import type { TokenVerifier } from "./authorization/token_verifier.ts";
import { EdgeWorkerDispatcher } from "./dispatch/edge_worker_dispatcher.ts";
import { EdgeConfig } from "./edge_config.ts";
import { EdgeFunctionsRuntime } from "./edge_runtime.ts";
import { SupabaseEdgePlatform } from "./platform.ts";
import { DirectoryServiceResolver } from "./services/directory_service_resolver.ts";

function tokenVerifier(config: EdgeConfig): TokenVerifier {
  const candidates: readonly (TokenVerifier | null)[] = [
    HmacTokenVerifier.fromSecret(config.jwtSecret),
    JwksTokenVerifier.fromAuthUrl(config.authUrl),
  ];

  return new AlgorithmTokenVerifier(
    candidates.filter((verifier): verifier is TokenVerifier =>
      verifier !== null
    ),
  );
}

function requestAuthorizer(config: EdgeConfig): RequestAuthorizer {
  if (!config.verifyJwt) return new OpenRequestAuthorizer();
  return new JwtRequestAuthorizer(tokenVerifier(config), INTERNAL_SERVICES);
}

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
