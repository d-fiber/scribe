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

import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { Runtime } from "../lifecycle/runtime.ts";
import type { RequestAuthorizer } from "./authorization/request_authorizer.ts";
import type { WorkerDispatcher } from "./dispatch/worker_dispatcher.ts";
import type { ServiceResolver } from "./services/service_resolver.ts";

export interface EdgeRuntimeCollaborators {
  readonly resolver: ServiceResolver;
  readonly authorizer: RequestAuthorizer;
  readonly dispatcher: WorkerDispatcher;
}

export class EdgeFunctionsRuntime extends Runtime {
  override readonly name = "edge";

  readonly #resolver: ServiceResolver;
  readonly #authorizer: RequestAuthorizer;
  readonly #dispatcher: WorkerDispatcher;

  constructor(collaborators: EdgeRuntimeCollaborators) {
    super();
    this.#resolver = collaborators.resolver;
    this.#authorizer = collaborators.authorizer;
    this.#dispatcher = collaborators.dispatcher;
  }

  async handle(request: Request): Promise<Response> {
    try {
      const resolved = await this.#resolver.resolve(
        new URL(request.url).pathname,
      );

      const denial = await this.#authorizer.authorize(
        request,
        resolved?.service ?? "",
      );
      if (denial !== null) return denial;

      if (resolved === null) {
        return ServerResponse.badRequest({
          code: "missing_function_name",
          message: "Missing function name in request",
        });
      }

      return await this.#dispatcher.dispatch(request, resolved.servicePath);
    } catch (error) {
      console.error("[boot:edge] unhandled request failure:", error);
      return ServerResponse.unexpected({ code: "internal_error" });
    }
  }

  protected override listen(): void {
    Deno.serve((request) => this.handle(request));
  }
}
