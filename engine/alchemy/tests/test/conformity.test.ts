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

import { checkCacheDriver, expectLater, isA, MemoryCaches, throwsA } from "../../test/mod.ts";
import { AssertionError } from "../../test/expect/error.ts";
import type { Cache, CacheDriver, CacheOptions } from "../../mod.ts";

class RunsEveryTime implements CacheDriver {
  readonly #held = new Map<string, unknown>();

  open<T>(_options: CacheOptions): Cache<T> {
    const held = this.#held;
    return {
      get: (id) => Promise.resolve((held.get(id) ?? null) as T | null),
      getMany: (ids) => Promise.resolve(ids.map((id) => (held.get(id) ?? null) as T | null)),
      add: (id, value) => {
        held.set(id, value);
        return Promise.resolve();
      },
      addMany: (entries) => {
        for (const [id, value] of entries) held.set(id, value);
        return Promise.resolve();
      },
      delete: (id) => {
        held.delete(id);
        return Promise.resolve();
      },
      deleteMany: (...ids) => {
        for (const id of ids) held.delete(id);
        return Promise.resolve();
      },
      upsert: async (id, compute) => {
        const already = held.get(id);
        if (already !== undefined) return already as T;
        const value = await compute();
        held.set(id, value);
        return value;
      },
      clear: () => {
        held.clear();
        return Promise.resolve();
      },
    };
  }
}

Deno.test("the cache this repository ships keeps every promise the port makes", async () => {
  await checkCacheDriver(new MemoryCaches());
});

Deno.test("a driver that runs a computation once per caller is caught, not passed", async () => {
  await expectLater(() => checkCacheDriver(new RunsEveryTime()), throwsA(isA(AssertionError)));
});
