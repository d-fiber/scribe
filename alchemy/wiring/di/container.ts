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

import { BindingError } from "../bind/slot.ts";
import { DuplicateDeclarationError } from "../declare/registry.ts";

/** What a class looks like when all that matters is what it builds. */
// deno-lint-ignore no-explicit-any -- a constructor's parameters are contravariant, so unknown[] rejects one with typed arguments.
export type Token<T> = abstract new (...args: any[]) => T;

/** What a container holds for one token: how to build it, and what was built once it was. */
interface Binding<T> {
  /** What to call to build the value, the first time it is asked for. */
  readonly factory: () => T | Promise<T>;

  /** What the factory answered, or nothing while it has not run yet. */
  held: T | Promise<T> | undefined;
}

/**
 * A place many singletons live, each reached by the class that names it.
 *
 * @remarks
 * A {@link Slot} holds one thing, named by a string only the process that filled it and the
 * refusal agree on. A container holds as many things as a project or a package cares to register,
 * each named by its own class, which is what {@link Singleton} decorates: a project writes
 * `@Singleton([GroundSdk])` above `AdminServiceImpl`, and everything else asks the container for
 * `AdminService`, the abstract class `AdminServiceImpl` answers for, never the implementation.
 *
 * A binding is built at most once. `registerSingleton` only records how, and building happens the
 * first time something resolves it, the way {@link cache} only opens its driver at the first call.
 * Building eagerly at registration would force an order on registrations that do not depend on one
 * another, and a project's `wires` step is exactly where every class marked `@Singleton` runs its
 * decorator, all at once, at import.
 *
 * @example
 * ```ts ignore
 * container.registerSingleton(GroundSdk, () => GroundSdk.I);
 *
 * @Singleton([GroundSdk])
 * class AdminServiceImpl implements AdminService {
 *   constructor(private readonly groundSdk: GroundSdk) {}
 * }
 *
 * const admin = container.resolve(AdminService);
 * ```
 */
export class Container {
  /** What was registered, by the class it was registered under. */
  readonly #bindings = new Map<Token<unknown>, Binding<unknown>>();

  /**
   * Registers `factory` as the one way to build `token`.
   *
   * @throws {DuplicateDeclarationError} When `token` was already registered. Two classes both
   * answering for the same token is a wiring mistake, not a choice to make at random by whichever
   * import ran last.
   */
  registerSingleton<T>(token: Token<T>, factory: () => T | Promise<T>): void {
    if (this.#bindings.has(token)) {
      throw new DuplicateDeclarationError(`"${token.name}" is registered twice.`);
    }
    this.#bindings.set(token, { factory, held: undefined });
  }

  /**
   * What `token` resolves to, building it on the first call and answering the same value ever
   * after.
   *
   * @throws {BindingError} When nothing registered `token`, or when its factory answers a promise;
   * a token still being built is read with {@link resolveAsync} instead.
   */
  resolve<T>(token: Token<T>): T {
    const binding = this.#bound(token);
    binding.held ??= binding.factory();
    if (binding.held instanceof Promise) {
      throw new BindingError(
        `"${token.name}" was registered with a factory that builds it asynchronously. ` +
          `Call container.resolveAsync(${token.name}) instead of resolve.`,
      );
    }
    return binding.held;
  }

  /**
   * What `token` resolves to, waiting out a factory that builds it asynchronously.
   *
   * @throws {BindingError} When nothing registered `token`.
   */
  async resolveAsync<T>(token: Token<T>): Promise<T> {
    const binding = this.#bound(token);
    binding.held ??= binding.factory();
    return await binding.held;
  }

  /** Whether `token` was registered. */
  has<T>(token: Token<T>): boolean {
    return this.#bindings.has(token);
  }

  /**
   * Forgets `token`, so registering it again is accepted and the next resolve builds anew.
   *
   * @remarks
   * For a test that registers over a binding the process already made. Nothing in a running
   * process has any business calling this: a class registers itself once, at import.
   */
  forget<T>(token: Token<T>): void {
    this.#bindings.delete(token);
  }

  #bound<T>(token: Token<T>): Binding<T> {
    const binding = this.#bindings.get(token);
    if (!binding) {
      throw new BindingError(
        `"${token.name}" was never registered. Something has to call ` +
          `container.registerSingleton(${token.name}, ...) before anything resolves it.`,
      );
    }
    return binding as Binding<T>;
  }
}

/** The container every `@Singleton` class, and every project or package that reads one, shares. */
export const container: Container = new Container();
