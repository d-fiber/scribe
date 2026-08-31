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

import { container, type Token } from "./container.ts";

/** What a class looks like when all that matters is that it can be built. */
// deno-lint-ignore no-explicit-any -- a constructor's parameters are contravariant, so unknown[] rejects one with typed arguments.
type Constructible<T> = new (...args: any[]) => T;

/** What {@link Singleton} takes beyond the order it resolves a constructor's parameters in. */
export interface SingletonOptions {
  /**
   * The token this singleton resolves under, when it differs from the class itself.
   *
   * A class that implements an interface written as an abstract class registers under that
   * abstract class, so `container.resolve(AdminService)` answers an `AdminServiceImpl` without
   * whoever calls it naming the implementation.
   */
  readonly as?: Token<unknown>;
}

/**
 * Marks a class as the one way to build the service it, or {@link SingletonOptions.as}, names.
 *
 * @remarks
 * TypeScript erases a constructor's parameter types once it compiles, and `alchemy/` imports
 * nothing that could read them back at runtime, the way a language with reified generics could.
 * `deps` is what stands in: the token to resolve for each constructor parameter, in the order the
 * constructor takes them, so a class's dependencies are still read off the class itself rather
 * than assembled by hand in a file that has to be kept in step with it.
 *
 * What runs first, `container.resolve` or `@Singleton`, does not matter: registering only records
 * how to build the class, and building happens at the first resolve, the way {@link Container}
 * builds every binding. Only the constructor and whatever it does inline count as construction;
 * an implementation that needs a step after that, the way Dart chains `..init()`, calls it inside
 * the factory a caller of {@link Container.registerSingleton} writes by hand, or inside the
 * constructor itself.
 *
 * @param deps - What to resolve for each constructor parameter, in order.
 *
 * @example
 * ```ts
 * @Singleton([GroundSdk, NetworkService], { as: AdminService })
 * class AdminServiceImpl implements AdminService {
 *   constructor(private readonly groundSdk: GroundSdk, private readonly network: NetworkService) {}
 * }
 * ```
 */
export function Singleton<T>(deps: readonly Token<unknown>[] = [], options: SingletonOptions = {}) {
  return function (target: Constructible<T>, _context: ClassDecoratorContext): void {
    const token = (options.as ?? target) as Token<T>;
    container.registerSingleton(token, () => new target(...deps.map((dep) => container.resolve(dep))));
  };
}
