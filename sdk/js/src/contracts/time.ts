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

/** A duration, stored as milliseconds and read out in whichever unit the caller wants. */
export class Time {
  readonly #ms: number;

  private constructor(ms: number) {
    this.#ms = ms;
  }

  /** This duration, in seconds. */
  get value(): number {
    return this.#ms / 1000;
  }

  /** This duration, in milliseconds. */
  get ms(): number {
    return this.#ms;
  }

  /** This duration in seconds, so a `Time` compares and does arithmetic like a plain number. */
  valueOf(): number {
    return this.value;
  }

  /** This duration in seconds, as a string. */
  toString(): string {
    return String(this.value);
  }

  /** A duration of `n` seconds. */
  static seconds(n: number): Time {
    return new Time(n * 1_000);
  }

  /** A duration of `n` minutes. */
  static minutes(n: number): Time {
    return new Time(n * 60_000);
  }

  /** A duration of `n` hours. */
  static hours(n: number): Time {
    return new Time(n * 3_600_000);
  }

  /** A duration of `n` days. */
  static days(n: number): Time {
    return new Time(n * 86_400_000);
  }

  /** A duration of `n` milliseconds. */
  static ms(n: number): Time {
    return new Time(n);
  }
}

/** A byte size, stored as bytes and read out in whichever unit the caller wants. */
export class Size {
  readonly #bytes: number;

  private constructor(bytes: number) {
    this.#bytes = bytes;
  }

  /** This size, in bytes. */
  get bytes(): number {
    return this.#bytes;
  }

  /** This size in bytes, so a `Size` compares and does arithmetic like a plain number. */
  valueOf(): number {
    return this.#bytes;
  }

  /** A size of `n` bytes. */
  static bytes(n: number): Size {
    return new Size(n);
  }

  /** A size of `n` kilobytes. */
  static kilobytes(n: number): Size {
    return new Size(n * 1_024);
  }

  /** A size of `n` megabytes. */
  static megabytes(n: number): Size {
    return new Size(n * 1_048_576);
  }
}
