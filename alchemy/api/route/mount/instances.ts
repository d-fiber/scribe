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

import type { List } from "../../../value/list.ts";
import type { DiscoveredModule } from "./discovery.ts";

type Instantiable<T> = new () => T;

/**
 * Marks a class this repository exports for a project to extend, never to mount.
 *
 * @remarks
 * `abstract` is a word the compiler reads and the runtime does not, so `Get.prototype instanceof
 * Endpoint` holds and `new Get()` succeeds. A file that re-exports a base, which a barrel or a
 * shared intermediate class does without meaning anything by it, therefore used to mount a second
 * route that answered nothing: the object had a verb and no body, and the failure arrived at the
 * first call rather than at the boot that built it.
 *
 * It is a symbol so that a project naming a static member of its own can never collide with it.
 */
export const BASE: unique symbol = Symbol("scribe.base");

/**
 * Every export of `module` that extends `base`, instantiated.
 *
 * This is how a convention file declares what it declares: the generator hands
 * over the module namespace and nothing else, so the base class is what tells
 * an endpoint from a middleware from a log sink. A file may hold several, and
 * a file that holds none is not an error, since an empty `_logs.ts` is a
 * project that has not written its sink yet.
 *
 * What this repository exports to be extended is skipped, however a file came to
 * export it. See {@link BASE}.
 */
export function instances<T>(
  module: DiscoveredModule,
  // deno-lint-ignore no-explicit-any
  base: abstract new (...args: List<any>) => unknown,
): List<T> {
  return Object.values(module)
    .filter((exported): exported is Instantiable<T> =>
      typeof exported === "function" &&
      exported.prototype instanceof base &&
      !Object.hasOwn(exported, BASE)
    )
    .map((constructor) => new constructor());
}
