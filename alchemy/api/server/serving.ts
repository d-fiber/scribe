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

import { Slot } from "../../bind/slot.ts";
import type { Future } from "../../async/future.ts";

/** What a server is asked to listen on. */
export interface ServeOptions {
  /** Which port to answer on. */
  readonly port: number;

  /** Which address to answer on. */
  readonly hostname: string;

  /** What stops it, when anything is meant to. */
  readonly signal?: AbortSignal;

  /** Called once it is listening, with what it ended up listening on. */
  readonly onListen?: (address: { port: number; hostname: string }) => void;
}

/** A server that is running, and the one thing a caller does with it. */
export interface Serving {
  /** Settles when the server has stopped, however it stopped. */
  readonly finished: Future<void>;
}

/** What holds a socket open and hands each request to `handle`. */
export interface ServeDriver {
  /**
   * Starts answering on `options`, handing every request to `handle`.
   *
   * @param handle - What answers one request. It is called for every request, including the ones
   * no route claims, so it answers rather than raising.
   */
  serve(options: ServeOptions, handle: (request: Request) => Future<Response>): Serving;
}

/**
 * What answers a worker that has to be reachable.
 *
 * @remarks
 * Holding a socket open is the one thing this repository cannot do, so the shape is here and what
 * listens is filled from outside. A test fills it with something that keeps the handler and calls
 * it by hand, which is how a whole worker is exercised without a port being taken.
 */
export const Servers: Slot<ServeDriver> = new Slot<ServeDriver>("Servers");
