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
