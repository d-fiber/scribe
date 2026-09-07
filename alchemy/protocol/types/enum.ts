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

import { Registry } from "../../declare/registry.ts";
import type { UnmodifiableList } from "../../value/list.ts";
import type { ContractAddable, ProtoFileRef } from "../file.ts";

/** One value of a {@link DeclaredProtoEnum}, exactly as {@link ProtoEnumBuilder.value} recorded it. */
export interface DeclaredEnumValue {
  /** The name this value is declared under. */
  readonly name: string;

  /** The number this value takes on the wire, author-supplied and never inferred — see `types/field.ts`'s own `FieldDefinition.number` for why. */
  readonly number: number;
}

/** A proto3 enum exactly as {@link ProtoEnum} declared it. */
export interface DeclaredProtoEnum {
  /** The name this enum is created under. */
  readonly name: string;

  /** The values this enum accepts, in the order {@link ProtoEnumBuilder.value} gave them. The first always numbers `0`, proto3's own required default. */
  readonly values: UnmodifiableList<DeclaredEnumValue>;

  /** The numbers this enum retires from a previous version of the contract, refused to any {@link values} entry. */
  readonly reservedNumbers: UnmodifiableList<number>;

  /** The names this enum retires from a previous version of the contract, refused to any future {@link values} entry — nothing here checks that, since it is a fact about a version not yet written. */
  readonly reservedNames: UnmodifiableList<string>;
}

/** A proto3 enum, and the file it belongs to — not part of {@link DeclaredProtoEnum} itself, since which file an enum belongs to is where it is filed, not a fact carried on the enum. */
interface StoredEnum {
  /** The file this enum belongs to. */
  readonly file: ProtoFileRef;

  /** The enum exactly as `ProtoEnum` declared it. */
  readonly enum: DeclaredProtoEnum;
}

/** Every enum this contract has declared, by the name it took. */
const declared = new Registry<StoredEnum>("enum");

/**
 * A proto3 enum type named `name`, growing one numbered value at a time, declared once handed to
 * a `ContractFile`'s own `.with`.
 *
 * @remarks
 * Named `ProtoEnum` rather than `Enum`: `schema/types/enum.ts` already exports `Enum` for a Postgres
 * enum type, and the two would collide the moment both are re-exported from the same module.
 *
 * A field opened with `f.enum("LogLevel")`, in `types/field.ts`, takes this enum by name: nothing
 * here checks that the name it took resolves, because a field can be declared before the rest of
 * the contract is known to exist — the same choice `schema/types/enum.ts` makes for a column.
 *
 * Unlike `Message`, nothing here closes the chain with a call of its own: `ContractFile`'s own
 * `.with` reads whatever `.value` last answered directly, so `ProtoEnumBuilder` implements
 * {@link ContractAddable} itself, rather than answering a `ContractEntry` the way a closing call
 * would — the same split `schema/schema.md` documents for its own `Enum` and `Drop`.
 */
export class ProtoEnumBuilder implements ContractAddable<DeclaredProtoEnum> {
  readonly #name: string;
  readonly #values: DeclaredEnumValue[] = [];
  #reservedNumbers: UnmodifiableList<number> = [];
  #reservedNames: UnmodifiableList<string> = [];

  /** Opened by `ProtoEnum`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Adds `name`, numbered `number`, to the values this enum accepts, in the order `ProtoEnum` will list them. The first value added must number `0`, proto3's own required default. */
  value(name: string, number: number): this {
    this.#values.push({ name, number });
    return this;
  }

  /** Retires `numbers` from a previous version of this enum, refusing them to any value declared here. */
  reserved(numbers: UnmodifiableList<number>): this {
    this.#reservedNumbers = numbers;
    return this;
  }

  /** Retires `names` from a previous version of this enum, refusing them to any value declared here in the future. */
  reservedNames(names: UnmodifiableList<string>): this {
    this.#reservedNames = names;
    return this;
  }

  /**
   * Registers this enum for `file`, called by `ContractFile`'s own `.with`, never directly.
   *
   * @throws {Error} When no value was added, when the first value added does not number `0`, or
   * when a number repeats across two values or falls in a range this enum also reserves.
   * @throws {DuplicateDeclarationError} When this enum's name has already been declared.
   */
  declareInto(file: ProtoFileRef): DeclaredProtoEnum {
    if (this.#values.length === 0 || this.#values[0].number !== 0) {
      throw new Error(
        `Enum "${this.#name}" must open with a value numbered 0, proto3's own required default.`,
      );
    }

    const seen = new Set<number>();
    for (const entry of this.#values) {
      if (
        seen.has(entry.number) || this.#reservedNumbers.includes(entry.number)
      ) {
        throw new Error(
          `Enum "${this.#name}" reuses the number ${entry.number} across two values, or on a value this enum also reserves.`,
        );
      }
      seen.add(entry.number);
    }

    const enumDecl: DeclaredProtoEnum = {
      name: this.#name,
      values: this.#values,
      reservedNumbers: this.#reservedNumbers,
      reservedNames: this.#reservedNames,
    };
    return declared.declare(this.#name, { file, enum: enumDecl }).enum;
  }
}

/**
 * Opens a proto3 enum type named `name`.
 *
 * @example
 * ```ts ignore
 * contract.file("protocol/logs.proto", "scribe.v1").with((w) => [
 *   w.enum("LogLevel")
 *     .value("LOG_LEVEL_UNSPECIFIED", 0)
 *     .value("LOG_LEVEL_DEBUG", 1)
 *     .value("LOG_LEVEL_INFO", 2),
 * ]);
 * ```
 */
export function ProtoEnum(name: string): ProtoEnumBuilder {
  return new ProtoEnumBuilder(name);
}

/** Every enum this contract has declared for `file`, in the order it declared them. */
export function declaredProtoEnums(
  file: ProtoFileRef,
): UnmodifiableList<DeclaredProtoEnum> {
  return declared.all().filter((entry) => entry.file.path === file.path).map((
    entry,
  ) => entry.enum);
}

/** Forgets every declared enum, which is what a test does between cases. */
export function forgetProtoEnums(): void {
  declared.forget();
}
