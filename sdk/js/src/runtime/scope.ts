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

import { AsyncLocalStorage } from "node:async_hooks";
import type { CallCredentials } from "../transport/client.ts";

export interface CallScopeState {
  readonly capabilityToken: string;
  readonly traceId: string;
  readonly invocationId: string;

  /**
   * The node this call is running for, empty when it runs for none.
   *
   * It is what lets `log` reach the node's own sink without a round trip
   * through the host. A queue pass or a cron carries none: those belong to the
   * project rather than to one of its nodes.
   */
  readonly node: string;
}

const storage = new AsyncLocalStorage<CallScopeState>();

let ambient: CallScopeState = {
  capabilityToken: "",
  traceId: "",
  invocationId: "",
  node: "",
};

/** The state of the call in flight, and the two ways a runtime installs it. */
export interface CallScopeApi {
  /**
   * Runs `handler` with `state` as the scope everything inside it reads.
   *
   * The state is held in async local storage, so it follows the awaits of `handler` and is gone
   * once it returns. This is what a runtime serving several calls at once uses, because each call
   * then reads its own.
   */
  run<T>(state: CallScopeState, handler: () => T): T;

  /**
   * Makes `state` the scope read wherever no `run` is in flight.
   *
   * There is one such state for the whole process. It is for a runtime that handles one call at a
   * time: a concurrent one that adopted instead of running would have two calls read each other's
   * token.
   */
  adopt(state: CallScopeState): void;

  /** The scope of the call in flight, falling back to the adopted one when there is none. */
  current(): CallScopeState;

  /** What the transport puts on every call it sends, taken from the scope in flight. */
  credentials(): CallCredentials;
}

export const CallScope: CallScopeApi = {
  run<T>(state: CallScopeState, handler: () => T): T {
    return storage.run(state, handler);
  },

  adopt(state: CallScopeState): void {
    ambient = state;
  },

  current(): CallScopeState {
    return storage.getStore() ?? ambient;
  },

  credentials(): CallCredentials {
    const { capabilityToken, traceId } = CallScope.current();
    return { capabilityToken, traceId };
  },
};
