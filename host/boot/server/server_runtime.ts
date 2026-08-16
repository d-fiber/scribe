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

import { serve } from "@scribe/core/kernel/http/serve/mod.ts";
import { pathnameOf } from "@scribe/core/runtime/http/pathname.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";
import type { Bootstrapper } from "../lifecycle/bootstrapper.ts";
import { Runtime } from "../lifecycle/runtime.ts";
import { CronBootstrapper } from "./bootstrappers/cron_bootstrapper.ts";
import { ExtensionsBootstrapper } from "./bootstrappers/extensions_bootstrapper.ts";
import { QueueBootstrapper } from "./bootstrappers/queue_bootstrapper.ts";
import type { SurfaceRegistry } from "./surface_registry.ts";
import { SurfaceRouter } from "./surface_router.ts";

export class ServerRuntime extends Runtime {
  override readonly name = "server";

  readonly #router: SurfaceRouter;

  constructor(registry: SurfaceRegistry) {
    super();
    this.#router = new SurfaceRouter(registry);
  }

  protected override bootstrappers(): readonly Bootstrapper[] {
    return [
      new ExtensionsBootstrapper(),
      new CronBootstrapper(),
      new QueueBootstrapper(),
    ];
  }

  protected override shutdownSignals(): readonly Deno.Signal[] {
    return ["SIGTERM", "SIGINT"];
  }

  protected override listen(): void {
    serve(() => this.#router.route(pathnameOf(RequestScope.get().url)));
  }
}
