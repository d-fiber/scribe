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

import { Registry } from "../../../declare/registry.ts";
import type { UnmodifiableList } from "../../../value/list.ts";
import type { DbMoment } from "../access/grant.ts";

/** The Postgres type a sequence's values are represented as. `bigint` when left out, Postgres's own default. */
export type SequenceDataType = "smallint" | "integer" | "bigint";

/**
 * The column a sequence is tied to, so that dropping the column drops the sequence with it and a
 * role granted access to the column also gains access to the sequence.
 */
export interface SequenceOwner {
  /** The table {@link column} belongs to. */
  readonly table: string;

  /** The column this sequence is tied to. */
  readonly column: string;
}

/** A sequence exactly as `Sequence` declared it. */
export interface DeclaredSequence {
  /** The name this sequence is created under. */
  readonly name: string;

  /** The Postgres type this sequence's values are represented as. Null for Postgres's own default, `bigint`. */
  readonly as: SequenceDataType | null;

  /** The step this sequence advances by on each value, negative for a descending sequence. Null for Postgres's own default, `1`. */
  readonly incrementBy: number | null;

  /** The lowest value this sequence produces, or `"none"` for no floor. Null for Postgres's own default for its type. */
  readonly minValue: number | "none" | null;

  /** The highest value this sequence produces, or `"none"` for no ceiling. Null for Postgres's own default for its type. */
  readonly maxValue: number | "none" | null;

  /** The value this sequence starts from. Null for its own {@link minValue}. */
  readonly startWith: number | null;

  /** How many values this sequence precomputes and holds in memory. Null for Postgres's own default, `1`. */
  readonly cache: number | null;

  /** Whether this sequence wraps back to its bound once exhausted, rather than refusing a further value. */
  readonly cycle: boolean;

  /** The column this sequence is tied to. Null when it stands on its own. */
  readonly ownedBy: SequenceOwner | null;
}

/** A sequence, and the moment it belongs to — not part of {@link DeclaredSequence} itself, since which moment a sequence belongs to is where it is filed, not a fact carried on the sequence. */
interface StoredSequence {
  /** The moment this sequence belongs to. */
  readonly moment: DbMoment;

  /** The sequence exactly as `Sequence` declared it. */
  readonly sequence: DeclaredSequence;
}

/** Every sequence this package has declared, by the name it took. */
const declared = new Registry<StoredSequence>("sequence");

/**
 * A Postgres sequence under construction, closed by {@link SequenceBuilder.create}.
 *
 * @remarks
 * `.identity(...)` on a column, in `types/column.ts`, already covers the ordinary case: a counter
 * tied to exactly one column, created and dropped along with it. This is for a counter that
 * outlives any single column — shared across several tables, or read directly by application code
 * through `nextval(...)` — the same reason a standalone `Grant` exists beside `Table`'s own
 * `.grants`.
 */
export class SequenceBuilder {
  readonly #name: string;
  readonly #moment: DbMoment;
  #as?: SequenceDataType;
  #incrementBy?: number;
  #minValue?: number | "none";
  #maxValue?: number | "none";
  #startWith?: number;
  #cache?: number;
  #cycle?: boolean;
  #ownedBy?: SequenceOwner;

  /** Opened by one of {@link SequenceMoment}'s own methods, never directly. */
  constructor(name: string, moment: DbMoment) {
    this.#name = name;
    this.#moment = moment;
  }

  /** The Postgres type this sequence's values are represented as. `bigint` when left out, Postgres's own default. */
  as(type: SequenceDataType): this {
    this.#as = type;
    return this;
  }

  /** The step this sequence advances by on each value, negative for a descending sequence. `1` when left out. */
  incrementBy(step: number): this {
    this.#incrementBy = step;
    return this;
  }

  /** The lowest value this sequence produces, or `"none"` for no floor. Postgres's own default for its type when left out. */
  minValue(value: number | "none"): this {
    this.#minValue = value;
    return this;
  }

  /** The highest value this sequence produces, or `"none"` for no ceiling. Postgres's own default for its type when left out. */
  maxValue(value: number | "none"): this {
    this.#maxValue = value;
    return this;
  }

  /** The value this sequence starts from. Its own {@link minValue} when left out. */
  startWith(value: number): this {
    this.#startWith = value;
    return this;
  }

  /** How many values this sequence precomputes and holds in memory. `1` when left out. */
  cache(value: number): this {
    this.#cache = value;
    return this;
  }

  /** Lets this sequence wrap back to its bound once exhausted, rather than refusing a further value. */
  cycle(): this {
    this.#cycle = true;
    return this;
  }

  /** Ties this sequence to `column` of `table`, so dropping the column drops the sequence with it. */
  ownedBy(table: string, column: string): this {
    this.#ownedBy = { table, column };
    return this;
  }

  /**
   * Declares this sequence, without reaching anything.
   *
   * @throws {DuplicateDeclarationError} When this sequence's name has already been declared,
   * raised where this is called.
   */
  create(): DeclaredSequence {
    const sequence: DeclaredSequence = {
      name: this.#name,
      as: this.#as ?? null,
      incrementBy: this.#incrementBy ?? null,
      minValue: this.#minValue ?? null,
      maxValue: this.#maxValue ?? null,
      startWith: this.#startWith ?? null,
      cache: this.#cache ?? null,
      cycle: this.#cycle === true,
      ownedBy: this.#ownedBy ?? null,
    };
    declared.declare(this.#name, { moment: this.#moment, sequence });
    return sequence;
  }
}

/**
 * The moment `Sequence`'s `name` renders under, not yet chosen — exposes only the three moments a
 * sequence can belong to, and nothing else, so no other method of `SequenceBuilder` ever appears
 * before the one choice everything else it carries renders under.
 */
export class SequenceMoment {
  readonly #name: string;

  /** Opened by `Sequence`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Renders this sequence once, against the package's own schema. */
  init(): SequenceBuilder {
    return new SequenceBuilder(this.#name, "init");
  }

  /** Renders this sequence once, applied through `dbmate` as the package evolves. */
  migrations(): SequenceBuilder {
    return new SequenceBuilder(this.#name, "migrations");
  }

  /** Renders this sequence before the package's own schema exists. */
  provisioning(): SequenceBuilder {
    return new SequenceBuilder(this.#name, "provisioning");
  }
}

/**
 * Opens a Postgres sequence named `name`.
 *
 * @example
 * ```ts ignore
 * Sequence("booking_reference").init().as("integer").minValue(100000).cache(10).create();
 * ```
 */
export function Sequence(name: string): SequenceMoment {
  return new SequenceMoment(name);
}

/** Every sequence this package has declared for `moment`, in the order it declared them. */
export function declaredSequences(moment: DbMoment): UnmodifiableList<DeclaredSequence> {
  return declared.all().filter((entry) => entry.moment === moment).map((entry) => entry.sequence);
}

/** Forgets every declared sequence, which is what a test does between cases. */
export function forgetSequences(): void {
  declared.forget();
}
