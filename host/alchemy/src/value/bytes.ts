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

import type { Comparable } from "./comparable.ts";
import type { UnmodifiableList } from "./list.ts";

/** How many bytes each unit holds. They are the binary units, so a kilobyte is 1024 and not 1000. */
const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;
const GIGABYTE = 1024 * MEGABYTE;

/**
 * A quantity of bytes.
 *
 * @remarks
 * It is spelled `Bytes` rather than `Size` because `Size` already means a width and a height in the
 * language this vocabulary is modelled on, and a limit on an upload has nothing to do with a
 * rectangle.
 *
 * It reads the way {@link Duration} does, on purpose: a named way in, and an `in…` getter for every
 * unit it was not written in.
 *
 * @example
 * ```ts
 * const limit = Bytes.megabytes(5);
 * if (upload.length > limit.inBytes) throw Refusal.invalid("the file is over 5 MB.");
 * ```
 */
export class Bytes implements Comparable<Bytes> {
  /** How many bytes this is, which is what every unit below is worked out from. */
  readonly #bytes: number;

  /**
   * Builds a quantity of `bytes`.
   *
   * It is private so a quantity is written in the unit it was meant in, through one of the factories
   * below, rather than as a number whose unit is left to whoever reads it.
   */
  private constructor(bytes: number) {
    this.#bytes = bytes;
  }

  /** How many bytes this is, which is what it holds. */
  get inBytes(): number {
    return this.#bytes;
  }

  /** How many kilobytes this is, whole and fractional. */
  get inKilobytes(): number {
    return this.#bytes / KILOBYTE;
  }

  /** How many megabytes this is, whole and fractional. */
  get inMegabytes(): number {
    return this.#bytes / MEGABYTE;
  }

  /** How many gigabytes this is, whole and fractional. */
  get inGigabytes(): number {
    return this.#bytes / GIGABYTE;
  }

  /** This quantity and `other` together. */
  add(other: Bytes): Bytes {
    return new Bytes(this.#bytes + other.#bytes);
  }

  /** This quantity less `other`, which may be negative. */
  subtract(other: Bytes): Bytes {
    return new Bytes(this.#bytes - other.#bytes);
  }

  /**
   * How many bytes this is, which is what a comparison between two of these reads.
   *
   * @remarks
   * It is here because TypeScript accepts `<` between two objects of the same type and cannot be
   * made to refuse it, so taking this away would leave `a < b` comparing two printed forms instead
   * of two quantities. Whoever wants equality wants {@link equals}.
   */
  valueOf(): number {
    return this.#bytes;
  }

  /** Whether `other` holds the same number of bytes as this. */
  equals(other: Bytes): boolean {
    return this.#bytes === other.#bytes;
  }

  /** This quantity written in the largest whole unit it fits, such as `5 MB`. */
  toString(): string {
    const units: UnmodifiableList<string> = ["B", "KB", "MB", "GB", "TB"];
    let held = Math.abs(this.#bytes);
    let unit = 0;

    while (held >= 1024 && unit < units.length - 1) {
      held /= 1024;
      unit++;
    }

    const sign = this.#bytes < 0 ? "-" : "";
    return `${sign}${Number(held.toFixed(2))} ${units[unit]}`;
  }

  /**
   * Where this falls against `other`, which is what sorts a list of quantities.
   *
   * @returns A negative number when this is smaller, zero when they are the same, a positive number
   * when this is bigger.
   */
  compareTo(other: Bytes): number {
    return this.inBytes - other.inBytes;
  }

  /** A quantity of `n` bytes. */
  static of(n: number): Bytes {
    return new Bytes(n);
  }

  /** A quantity of `n` kilobytes, each one 1024 bytes. */
  static kilobytes(n: number): Bytes {
    return new Bytes(n * KILOBYTE);
  }

  /** A quantity of `n` megabytes, each one 1024 kilobytes. */
  static megabytes(n: number): Bytes {
    return new Bytes(n * MEGABYTE);
  }

  /** A quantity of `n` gigabytes, each one 1024 megabytes. */
  static gigabytes(n: number): Bytes {
    return new Bytes(n * GIGABYTE);
  }
}
