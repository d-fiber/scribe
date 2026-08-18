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

import { ServerResponse } from "@scribe/core/kernel/http/response/json.ts";
import { forward } from "@scribe/core/kernel/http/serve/mod.ts";
import { NodeSurfaces } from "@scribe/host/project/worker/node_surfaces.ts";
import type { Hono } from "hono";

/**
 * The paths the host answers for itself, and the reason they start with `_`.
 *
 * Everything else belongs to a node, and a node is named after a folder of the
 * project. The route scanner skips a folder whose name starts with `_`, so a
 * project cannot produce a node called `_health` or `_queue` however it names
 * its tree -- the prefix is what makes the host's own paths uncollidable
 * rather than merely unlikely.
 */
const HEALTH_PATH = "/_health";
const QUEUE_PREFIX = "/_queue";

/**
 * Sends a request to the node that claims it.
 *
 * There is no surface left to choose between: a request names its node in its
 * first segment, and the host holds nothing at the root beyond the two paths
 * above. What a node serves, who may call it and what wraps it are decided by
 * the project and travel in the manifest.
 */
export class SurfaceRouter {
  readonly #queue: Hono;

  constructor(queue: Hono) {
    this.#queue = queue;
  }

  async route(pathname: string): Promise<Response> {
    try {
      if (pathname === HEALTH_PATH) return new Response("ok");

      if (pathname === QUEUE_PREFIX || pathname.startsWith(`${QUEUE_PREFIX}/`)) {
        return await forward(this.#queue, pathname.slice(QUEUE_PREFIX.length) || "/");
      }

      const node = NodeSurfaces.resolve(pathname);
      if (node === null) return ServerResponse.notFound();

      return await forward(node.app, node.subPath);
    } catch (error) {
      console.error("[boot:server] unhandled routing failure:", error);
      return ServerResponse.unexpected();
    }
  }
}
