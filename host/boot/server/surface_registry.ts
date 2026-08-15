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

import {
  INTERNAL_SEGMENTS,
  type InternalSegment,
  type RootSurface,
} from "@scribe/core/kernel/http/routing/root_route.ts";
import { logger } from "@scribe/core/kernel/observability/logger.ts";
import { Hono } from "hono";

export interface SurfaceApps {
  readonly admin: Hono;
  readonly app: Hono;
  readonly internal: Readonly<Record<InternalSegment, Hono>>;
}

export type SurfaceDecorator = (app: Hono) => Hono;

export class SurfaceRegistry {
  readonly #surfaces: Readonly<Record<RootSurface, Hono>>;

  private constructor(surfaces: Readonly<Record<RootSurface, Hono>>) {
    this.#surfaces = surfaces;
  }

  static compose(
    apps: SurfaceApps,
    decorate: SurfaceDecorator = logger,
  ): SurfaceRegistry {
    return new SurfaceRegistry({
      admin: decorate(apps.admin),
      app: decorate(apps.app),
      internal: SurfaceRegistry.#mountInternal(apps.internal),
    });
  }

  get(surface: RootSurface): Hono {
    return this.#surfaces[surface];
  }

  static #mountInternal(
    apps: Readonly<Record<InternalSegment, Hono>>,
  ): Hono {
    const internal = new Hono();
    for (const segment of INTERNAL_SEGMENTS) {
      internal.route(`/${segment}`, apps[segment]);
    }
    return internal;
  }
}
