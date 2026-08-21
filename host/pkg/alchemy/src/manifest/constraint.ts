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

import { Version, VersionError } from "./version.ts";

const BOUND = /^(>=|<=|>|<)(\d+\.\d+\.\d+)$/;

/**
 * The versions a dependency accepts, as one range with a low end and a high end.
 *
 * @remarks
 * A single range is enough because the forms a manifest is allowed to write all produce one:
 * `^1.2.3`, an exact version, and any number of `>=` and `<` bounds spelled side by side. A union
 * such as `1.0.0 or 2.0.0` is refused, since the two sides would have to be carried through
 * resolution separately for a case no package here has.
 */
export class Constraint {
  /** The text this constraint was read from, which is what an error message shows back. */
  readonly source: string;

  /** The lowest version accepted, or null when nothing bounds this constraint from below. */
  readonly min: Version | null;

  /** Whether {@link min} itself is accepted. */
  readonly includesMin: boolean;

  /** The highest version accepted, or null when nothing bounds this constraint from above. */
  readonly max: Version | null;

  /** Whether {@link max} itself is accepted. */
  readonly includesMax: boolean;

  private constructor(
    source: string,
    min: Version | null,
    includesMin: boolean,
    max: Version | null,
    includesMax: boolean,
  ) {
    this.source = source;
    this.min = min;
    this.includesMin = includesMin;
    this.max = max;
    this.includesMax = includesMax;
  }

  /**
   * The constraint `text` spells.
   *
   * @throws {VersionError} When `text` is neither `any`, a caret constraint, an exact version, nor
   * a series of bounds.
   */
  static parse(text: string): Constraint {
    const written = text.trim();
    if (written === "any" || written === "*") return Constraint.any();

    if (written.startsWith("^")) {
      const low = Version.parse(written.slice(1));
      return new Constraint(written, low, true, low.nextBreaking(), false);
    }

    const exact = Version.tryParse(written);
    if (exact !== null) {
      return new Constraint(written, exact, true, exact, true);
    }

    return Constraint.#fromBounds(written);
  }

  /** The constraint that accepts every version. */
  static any(): Constraint {
    return new Constraint("any", null, false, null, false);
  }

  /** The constraint that accepts `version` and nothing else. */
  static exactly(version: Version): Constraint {
    return new Constraint(version.toString(), version, true, version, true);
  }

  static #fromBounds(written: string): Constraint {
    const parts = written.split(/\s+/).filter((part) => part !== "");
    if (parts.length === 0) {
      throw new VersionError(
        `"${written}" is not a constraint. Write "^1.0.2", "1.0.2", or ">=1.0.2 <2.0.0".`,
      );
    }

    let bounded = Constraint.any();
    for (const part of parts) {
      const found = BOUND.exec(part);
      if (found === null) {
        throw new VersionError(
          `"${part}" is not a bound. Write it as ">=1.0.2" or "<2.0.0".`,
        );
      }

      const edge = Version.parse(found[2]);
      const side = found[1] === ">=" || found[1] === ">"
        ? new Constraint(part, edge, found[1] === ">=", null, false)
        : new Constraint(part, null, false, edge, found[1] === "<=");

      const narrowed = bounded.intersect(side);
      if (narrowed === null) {
        throw new VersionError(
          `"${written}" accepts no version: its bounds cross.`,
        );
      }
      bounded = narrowed;
    }

    return new Constraint(
      written,
      bounded.min,
      bounded.includesMin,
      bounded.max,
      bounded.includesMax,
    );
  }

  /** Whether `version` falls inside this constraint. */
  allows(version: Version): boolean {
    if (this.min !== null) {
      const against = version.compareTo(this.min);
      if (against < 0 || (against === 0 && !this.includesMin)) return false;
    }
    if (this.max !== null) {
      const against = version.compareTo(this.max);
      if (against > 0 || (against === 0 && !this.includesMax)) return false;
    }
    return true;
  }

  /**
   * The constraint that accepts what this one and `other` both accept, or null when nothing does.
   *
   * @remarks
   * The null answer is what resolution reads as a conflict, and the two `source` texts are what it
   * shows to name the disagreement, so neither is rewritten into a normal form on the way.
   */
  intersect(other: Constraint): Constraint | null {
    const low = Constraint.#higher(
      this.min,
      this.includesMin,
      other.min,
      other.includesMin,
    );
    const high = Constraint.#lower(
      this.max,
      this.includesMax,
      other.max,
      other.includesMax,
    );

    if (low.edge !== null && high.edge !== null) {
      const against = low.edge.compareTo(high.edge);
      if (against > 0) return null;
      if (against === 0 && !(low.included && high.included)) return null;
    }

    const source = this.source === other.source ? this.source : `${this.source} ${other.source}`;
    return new Constraint(
      source,
      low.edge,
      low.included,
      high.edge,
      high.included,
    );
  }

  static #higher(
    left: Version | null,
    leftIncluded: boolean,
    right: Version | null,
    rightIncluded: boolean,
  ): { edge: Version | null; included: boolean } {
    if (left === null) return { edge: right, included: rightIncluded };
    if (right === null) return { edge: left, included: leftIncluded };

    const against = left.compareTo(right);
    if (against > 0) return { edge: left, included: leftIncluded };
    if (against < 0) return { edge: right, included: rightIncluded };
    return { edge: left, included: leftIncluded && rightIncluded };
  }

  static #lower(
    left: Version | null,
    leftIncluded: boolean,
    right: Version | null,
    rightIncluded: boolean,
  ): { edge: Version | null; included: boolean } {
    if (left === null) return { edge: right, included: rightIncluded };
    if (right === null) return { edge: left, included: leftIncluded };

    const against = left.compareTo(right);
    if (against < 0) return { edge: left, included: leftIncluded };
    if (against > 0) return { edge: right, included: rightIncluded };
    return { edge: left, included: leftIncluded && rightIncluded };
  }

  /** This constraint as the manifest that carries it wrote it. */
  toString(): string {
    return this.source;
  }
}
