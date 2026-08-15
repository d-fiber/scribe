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

import { AsyncLocalStorage } from "node:async_hooks";

interface RequestState {
  req: Request;
  bodyBytes: Uint8Array;
  cache: Map<string, unknown>;
  peerAddress: string | null;
}

const storage = new AsyncLocalStorage<RequestState>();

function activeState(): RequestState {
  const store = storage.getStore();
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
    return storage.getStore()?.peerAddress ?? null;
  },

  set(req: Request, bodyBytes: Uint8Array): void {
    const state = activeState();
    state.req = req;
    state.bodyBytes = bodyBytes;
    state.cache.clear();
  },

  getBodyBytes(): Uint8Array | null {
    return storage.getStore()?.bodyBytes ?? null;
  },

  cache: {
    get<T>(key: string): T | undefined {
      return storage.getStore()?.cache.get(key) as T | undefined;
    },

    set<T>(key: string, value: T): void {
      storage.getStore()?.cache.set(key, value);
    },
  },
};
