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

import type { Environment } from "../../port/env.ts";

/**
 * A set of process settings held in a map, read the way the real environment would be.
 *
 * @remarks
 * It is what a test fills {@link Environments} with, so that what it checks does not depend on how
 * the machine running it is configured. A name it was not given reads `undefined`, exactly as an
 * unset variable does.
 *
 * @example
 * ```ts
 * Environments.use(new MemoryEnvironment({ REDIS_URL: "redis://localhost:6379" }));
 * ```
 */
export class MemoryEnvironment implements Environment {
  /** Every name this holds, and the value set for it. */
  readonly #held: Map<string, string>;

  /**
   * Builds an environment holding `values`.
   *
   * @param values - The names and values this reads, empty when left out.
   */
  constructor(values: Record<string, string> = {}) {
    this.#held = new Map(Object.entries(values));
  }

  /** The value set for `name`, or `undefined` when this holds none. */
  get(name: string): string | undefined {
    return this.#held.get(name);
  }

  /** Every name and value this holds, as a plain object. */
  toObject(): Record<string, string> {
    return Object.fromEntries(this.#held);
  }

  /** Sets `name` to `value`, over whatever was there. */
  set(name: string, value: string): void {
    this.#held.set(name, value);
  }

  /** Forgets `name`, so the next read of it is `undefined`. */
  unset(name: string): void {
    this.#held.delete(name);
  }
}
