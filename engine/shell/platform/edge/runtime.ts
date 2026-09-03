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

/**
 * The three collaborators `EdgeFunctionsRuntime` composes into a request pipeline.
 *
 * @remarks
 * Handed in rather than constructed inside {@link EdgeFunctionsRuntime}, because each one already
 * has its own reason to vary independently: a resolver that reads the filesystem differently in a
 * test, an authorizer chosen by whether JWT verification is on, a dispatcher that knows how to
 * reach the platform's own worker isolates. Building them here would tie all three choices to one
 * constructor instead of leaving each to the code that already decides it.
 */
export interface EdgeRuntimeCollaborators {
  /** Turns an incoming path into the service that answers it. */
  readonly resolver: ServiceResolver;

  /** Decides whether a request is allowed to reach the service `resolver` found. */
  readonly authorizer: RequestAuthorizer;

  /** Runs the resolved service's worker and turns its answer into a response. */
  readonly dispatcher: WorkerDispatcher;
}

/**
 * The `Runtime` this deployment boots on the edge platform.
 *
 * @remarks
 * Unlike `engine/shell/platform/server/runtime.ts`, which serves every node from one long-lived
 * process, this runtime spins up a fresh worker isolate per resolved service on every request. It
 * exists as its own `Runtime` rather than a mode of the other one because the two differ in more
 * than how they listen: they resolve, authorize and dispatch through entirely different
 * collaborators, matched to what each platform actually offers.
 */
export class EdgeFunctionsRuntime extends Runtime {
  /** This runtime's label in `BootSequence` logging, and the prefix every line it logs carries. */
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

  /**
   * Resolves `request` to a service, authorizes it, and dispatches it to that service's worker.
   *
   * @remarks
   * Authorization runs even when resolution finds nothing, so a request the deployment refuses
   * never leaks whether the function it named exists. An unresolved request that does pass
   * authorization is answered with `missing_function_name` instead of falling through to a
   * dispatch that has nothing to dispatch to. Anything else that goes wrong is logged and answered
   * as an internal error rather than left to propagate.
   */
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

  /**
   * The {@link Runtime.listen} implementation.
   *
   * @remarks
   * Reaches the host through {@link Listeners} rather than opening a socket itself, the same
   * indirection `engine/runtime/scholium/` uses everywhere a host capability is needed: this file
   * never has to know how a socket is opened on the platform underneath it, only that `serve`
   * exists.
   */
  protected override listen(): void {
    Listeners.get().serve((request) => this.handle(request));
  }
}
