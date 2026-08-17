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

import type { DiscoveredModule } from "./discovery.ts";

type Instantiable<T> = new () => T;

/**
 * Every export of `module` that extends `base`, instantiated.
 *
 * This is how a convention file declares what it declares: the generator hands
 * over the module namespace and nothing else, so the base class is what tells
 * an endpoint from a middleware from a log sink. A file may hold several, and
 * a file that holds none is not an error -- an empty `_log.ts` is a project
 * that has not written its sink yet.
 */
export function instances<T>(module: DiscoveredModule, base: Function): T[] {
  return Object.values(module)
    .filter((exported): exported is Instantiable<T> =>
      typeof exported === "function" && exported.prototype instanceof base
    )
    .map((constructor) => new constructor());
}
