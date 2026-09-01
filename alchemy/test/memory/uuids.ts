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

import type { UnmodifiableList } from "../../value/list.ts";
import type { UuidSource } from "../../value/uuid.ts";

/** How many digits the counter fills in the last field of the identifier. */
const WIDTH = 12;

/**
 * Identifiers that follow one another, and still read as the shape their version describes.
 *
 * @remarks
 * It is what a test puts in `Uuids`. Both halves matter: a case can name `"...-000000000001"`
 * because it knows the first one handed out will be that, and anything that parses what it was
 * given still finds a well formed identifier rather than a counter in a string.
 *
 * @example
 * ```ts
 * const drawn = new SequentialUuids();
 * Uuids.use(drawn);
 *
 * await place(basket);
 * assertEquals(drawn.handed.length, 1);
 * ```
 */
export class SequentialUuids implements UuidSource {
  /** Every identifier handed out, in the order it was handed. */
  readonly #handed: string[] = [];

  /** How many have been handed out, which is what the next one is drawn from. */
  #count = 0;

  /** Every identifier this has handed out, in the order it handed them. */
  get handed(): UnmodifiableList<string> {
    return this.#handed;
  }

  /** The next identifier, spelled as a version four so anything reading the version agrees. */
  v4(): string {
    return this.#draw(4);
  }

  /** The next identifier, spelled as a version six. It counts from the same place as {@link v4}. */
  v6(): string {
    return this.#draw(6);
  }

  /** Hands out the next identifier, carrying `version` where the version nibble goes. */
  #draw(version: number): string {
    this.#count += 1;
    const drawn = `00000000-0000-${version}000-8000-${String(this.#count).padStart(WIDTH, "0")}`;
    this.#handed.push(drawn);
    return drawn;
  }
}
