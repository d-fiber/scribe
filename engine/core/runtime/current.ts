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
import { type CurrentDriver, type CurrentStore, Currents } from "@scribe/alchemy";

/** One store, kept in the call tree the runtime tracks for us. */
class AsyncLocalStore<T> implements CurrentStore<T> {
  /** What holds the value for the duration of a call tree. */
  readonly #storage = new AsyncLocalStorage<T>();

  run<R>(value: T, body: () => R): R {
    return this.#storage.run(value, body);
  }

  get(): T | null {
    return this.#storage.getStore() ?? null;
  }
}

/**
 * What opens a store on the runtime this host runs on.
 *
 * @remarks
 * The vocabulary declares a port rather than reaching for `node:async_hooks` itself, because
 * what carries a value down a call tree is a property of the runtime and not of the language a
 * package is written in. This is the one implementation the framework ships, and filling the
 * port here rather than at boot is deliberate: anything that reads a scope imports this module
 * on the way, so a test that never boots still finds the port filled.
 */
class AsyncLocalCurrents implements CurrentDriver {
  open<T>(): CurrentStore<T> {
    return new AsyncLocalStore<T>();
  }
}

Currents.use(new AsyncLocalCurrents());
