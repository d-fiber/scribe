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

import { Current } from "@scribe/alchemy";
import "./current.ts";

interface RequestState {
  req: Request;
  bodyBytes: Uint8Array;
  cache: Map<string, unknown>;
  peerAddress: string | null;
}

const storage = new Current<RequestState>("RequestScope");

function activeState(): RequestState {
  const store = storage.get();
  if (!store) throw new Error("RequestScope not initialized");
  return store;
}

export interface RequestScopeCache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}

export interface RequestScopeApi {
  run<T>(
    req: Request,
    bodyBytes: Uint8Array,
    handler: () => T,
    peerAddress?: string | null,
  ): T;
  get(): Request;
  peer(): string | null;
  set(req: Request, bodyBytes: Uint8Array): void;
  getBodyBytes(): Uint8Array | null;

  /** Per-request scratch storage, cleared whenever `set` swaps in a new request. */
  readonly cache: RequestScopeCache;
}

export const RequestScope: RequestScopeApi = {
  run<T>(
    req: Request,
    bodyBytes: Uint8Array,
    handler: () => T,
    peerAddress: string | null = null,
  ): T {
    return storage.run(
      { req, bodyBytes, cache: new Map(), peerAddress },
      handler,
    );
  },

  get(): Request {
    return activeState().req;
  },

  peer(): string | null {
    return storage.get()?.peerAddress ?? null;
  },

  set(req: Request, bodyBytes: Uint8Array): void {
    const state = activeState();
    state.req = req;
    state.bodyBytes = bodyBytes;
    state.cache.clear();
  },

  getBodyBytes(): Uint8Array | null {
    return storage.get()?.bodyBytes ?? null;
  },

  cache: {
    get<T>(key: string): T | undefined {
      return storage.get()?.cache.get(key) as T | undefined;
    },

    set<T>(key: string, value: T): void {
      storage.get()?.cache.set(key, value);
    },
  },
};
