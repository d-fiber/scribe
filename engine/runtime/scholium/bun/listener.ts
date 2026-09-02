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

import "@scribe/runtime/scholium/bun/global.d.ts";

import type {
  BoundListener,
  Listener,
  ListenOptions,
  RemotePeer,
  RequestHandler,
} from "@scribe/runtime/scholium/listener.ts";

/**
 * The socket this process actually opens under Bun, as the port describes a listener.
 *
 * @remarks
 * It is the only file in this folder that knows how a socket is opened here. Whatever this
 * process actually runs on decides what that means; the day it changes, this class is rewritten
 * and nothing that reaches it through the port notices. Unlike a Node implementation, this one
 * needs no bridge: `Bun.serve` binds the socket and resolves the real port synchronously, the same
 * contract `Deno.serve` keeps.
 */
export class LocalListener implements Listener {
  /**
   * The {@link Listener.serve} implementation.
   *
   * @remarks
   * `handler` is wrapped rather than passed straight to `Bun.serve`'s own `fetch` option, because
   * the host hands the connection alongside the request and `handler` wants the peer address
   * alone, already extracted: this is where that translation happens, once, instead of in every
   * caller.
   */
  serve(handler: RequestHandler, options?: ListenOptions): BoundListener {
    const server = Bun.serve({
      port: options?.port,
      hostname: options?.hostname,
      fetch: (request, bound) => handler(request, _peerOf(request, bound)),
    });

    return {
      port: server.port,
      shutdown: () => {
        server.stop(true);
        return Promise.resolve();
      },
    };
  }
}

/** The peer a raw connection names, read down to what {@link RequestHandler} is given. */
function _peerOf(request: Request, bound: Bun.Server): RemotePeer {
  return { hostname: bound.requestIP(request)?.address ?? null };
}
