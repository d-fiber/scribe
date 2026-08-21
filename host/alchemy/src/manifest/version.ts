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

import { ScribeError } from "./error.ts";

/** Raised when a text cannot be read as a version, or as a constraint over versions. */
export class VersionError extends ScribeError {}

const RELEASE = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * A released version of a package, in the three numbers semantic versioning gives it.
 *
 * @remarks
 * A pre-release or build identifier is refused rather than ignored. A package is distributed by
 * the shared cache, which keys a directory on the text of the version, so a suffix that nothing
 * compares would make two entries out of what reads as one.
 */
export class Version {
  /** The number that rises when the package breaks what it published. */
  readonly major: number;

  /** The number that rises when the package adds to what it published. */
  readonly minor: number;

  /** The number that rises when the package fixes what it published. */
  readonly patch: number;

  private constructor(major: number, minor: number, patch: number) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  /**
   * The version `text` spells.
   *
   * @throws {VersionError} When `text` is not three numbers separated by dots.
   */
  static parse(text: string): Version {
    const parsed = Version.tryParse(text);
    if (parsed === null) {
      throw new VersionError(
        `"${text}" is not a version. Write three numbers, as in "1.0.2".`,
      );
    }
    return parsed;
  }

  /** The version `text` spells, or null when it spells none. */
  static tryParse(text: string): Version | null {
    const found = RELEASE.exec(text.trim());
    if (found === null) return null;
    return new Version(Number(found[1]), Number(found[2]), Number(found[3]));
  }

  /** Whether this version and `other` name the same release. */
  equals(other: Version): boolean {
    return this.compareTo(other) === 0;
  }

  /** How this version orders against `other`: below zero before it, zero the same, above zero after it. */
  compareTo(other: Version): number {
    if (this.major !== other.major) return this.major - other.major;
    if (this.minor !== other.minor) return this.minor - other.minor;
    return this.patch - other.patch;
  }

  /**
   * The first version that is allowed to break what this one published.
   *
   * @remarks
   * The number that rises is the leftmost one that is not zero, which is what makes `^0.1.2` stop
   * at `0.2.0` instead of at `1.0.0`. Before the first major release a package has no promise to
   * keep, so its minor number carries the breakage its major number carries later.
   */
  nextBreaking(): Version {
    if (this.major !== 0) return new Version(this.major + 1, 0, 0);
    if (this.minor !== 0) return new Version(0, this.minor + 1, 0);
    return new Version(0, 0, this.patch + 1);
  }

  /** This version as a package writes it. */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}
