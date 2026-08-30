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
import { ServerResponse } from "@scribe/alchemy/route";
import { Listeners } from "@scribe/runtime/scholium/listener.ts";
import { Runtime } from "../../common/runtime.ts";
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

  async handle(request: Request): Future<Response> {
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
      console.error("[shell:edge] unhandled request failure:", error);
      return ServerResponse.unexpected({ code: "internal_error" });
    }
  }

  protected override listen(): void {
    Listeners.get().serve((request) => this.handle(request));
  }
}
