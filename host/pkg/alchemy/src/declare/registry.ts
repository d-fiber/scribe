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

import { ScribeError } from "../manifest/error.ts";

/** Raised when two declarations take the same name. */
export class DuplicateDeclarationError extends ScribeError {}

/**
 * Everything of one kind a package declared, from the name it took to what it declared.
 *
 * @remarks
 * A declaration lives at module scope and is evaluated when the module is imported, so a name taken
 * twice is a fault of the source rather than of a run. This refuses it there, before anything has
 * read or written under either name.
 *
 * Every kind of declaration a package holds gets a registry of its own: audiences, channels, links,
 * indices, configs. What they share is this, so a package writes the rule once and gets the refusal
 * at import for free.
 *
 * @example
 * ```ts
 * const audiences = new Registry<Audience>("audience");
 *
 * export function declareAudience(name: string, held: Audience): Audience {
 *   return audiences.declare(name, held);
 * }
 * ```
 */
export class Registry<T> {
  readonly #kind: string;
  readonly #held = new Map<string, T>();

  /** Opens a registry for declarations of `kind`, which names them in whatever it refuses. */
  constructor(kind: string) {
    this.#kind = kind;
  }

  /**
   * Records that `name` was declared, and answers what was declared under it.
   *
   * @throws {DuplicateDeclarationError} When `name` was already taken. The name is what everything
   * else reaches the declaration by, so the second one would answer for what the first put there.
   */
  declare(name: string, value: T): T {
    if (this.#held.has(name)) {
      throw new DuplicateDeclarationError(`${this.#kind} "${name}" is declared twice.`);
    }
    this.#held.set(name, value);
    return value;
  }

  /** What was declared under `name`, or null when nothing was. */
  named(name: string): T | null {
    return this.#held.get(name) ?? null;
  }

  /** Whether `name` was declared. */
  holds(name: string): boolean {
    return this.#held.has(name);
  }

  /** Everything declared, in the order it was. */
  all(): readonly T[] {
    return [...this.#held.values()];
  }

  /** The names taken, in the order they were. */
  names(): readonly string[] {
    return [...this.#held.keys()];
  }

  /** How many declarations this registry holds. */
  get size(): number {
    return this.#held.size;
  }

  /**
   * Forgets everything declared.
   *
   * @remarks
   * For a test that declares under a name another case also uses. Nothing in a running process has
   * any business calling this: a declaration is evaluated once, at import.
   */
  forget(): void {
    this.#held.clear();
  }
}
