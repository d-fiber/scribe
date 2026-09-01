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
import { Slot } from "@scribe/alchemy";

/**
 * Where a request came from, as far as a handler needs to know.
 *
 * @remarks
 * It carries only what a handler has ever read back: the peer's hostname over a connection that
 * has one. A connection that carries none, a Unix socket today and whatever else tomorrow, answers
 * null rather than a shape the caller has to know how to read.
 */
export interface RemotePeer {
  /** The peer's hostname, or null when this connection carries none. */
  readonly hostname: string | null;
}

/** What {@link Listener.serve} binds to. Left to the host's own default for whatever is absent. */
export interface ListenOptions {
  /** The port to bind. */
  readonly port?: number;

  /** The address to bind. */
  readonly hostname?: string;
}

/** What answers a request as it arrives, told who it came from. */
export type RequestHandler = (request: Request, peer: RemotePeer) => Response | Future<Response>;

/** What {@link Listener.serve} hands back once it is bound. */
export interface BoundListener {
  /** The port this socket actually bound to, resolved even when `options.port` asked for any. */
  readonly port: number;

  /** Stops answering requests and releases the socket. */
  shutdown(): Future<void>;
}

/**
 * Somewhere a request reaches this process from outside it.
 *
 * @remarks
 * A caller never opens a socket itself. It asks {@link Listeners} for one and hands it a handler,
 * so the same code answers requests whether this process is a server that keeps running or an
 * isolate spun up per call. The three production callers never close what they open, since the
 * process ends instead; {@link BoundListener} exists for the caller that does, a test that binds
 * to an ephemeral port and tears it down again.
 */
export interface Listener {
  /** Starts answering requests with `handler`, bound as `options` says. */
  serve(handler: RequestHandler, options?: ListenOptions): BoundListener;
}

/**
 * What answers the shell when it needs to start taking requests.
 *
 * @remarks
 * The host fills this once, at boot, with whatever this process actually runs on. Nothing above
 * `engine/runtime/scholium/` names that host directly: swapping it for another one is a change
 * confined to this folder, because everything else only ever reaches {@link Listener}.
 *
 * @example
 * ```ts ignore
 * Listeners.get().serve((request, peer) => respond(request, peer), { port: 3000 });
 * ```
 */
export const Listeners: Slot<Listener> = new Slot<Listener>("Listeners");

/**
 * The socket this process actually opens, as the port describes a listener.
 *
 * @remarks
 * It is the only file in this folder that knows how a socket is opened here. Whatever this
 * process actually runs on decides what that means; the day it changes, this class is rewritten
 * and nothing that calls {@link Listeners} notices.
 */
export class LocalListener implements Listener {
  /**
   * The {@link Listener.serve} implementation.
   *
   * @remarks
   * `handler` is wrapped rather than passed straight to the host's own serve call, because the host
   * hands the connection info alongside the request and `handler` wants the peer address alone,
   * already extracted: this is where that translation happens, once, instead of in every caller.
   */
  serve(handler: RequestHandler, options?: ListenOptions): BoundListener {
    const wrapped = (request: Request, info: Deno.ServeHandlerInfo): Response | Future<Response> =>
      handler(request, _peerOf(info));

    const bound = options === undefined
      ? Deno.serve(wrapped)
      : Deno.serve({ port: options.port, hostname: options.hostname }, wrapped);

    return {
      port: (bound.addr as Deno.NetAddr).port,
      shutdown: () => bound.shutdown(),
    };
  }
}

/** The peer a raw connection names, read down to what {@link RequestHandler} is given. */
function _peerOf(info: Deno.ServeHandlerInfo): RemotePeer {
  return { hostname: info.remoteAddr.transport === "tcp" ? info.remoteAddr.hostname : null };
}
