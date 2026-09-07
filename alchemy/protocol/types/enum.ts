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

import type { UnmodifiableList } from "../../primitives/value/list.ts";

/** One value of a {@link DeclaredProtoEnum}, exactly as an {@link EnumValueBuilder} resolved it. */
export interface DeclaredEnumValue {
  /** The name this value is declared under. */
  readonly name: string;

  /** The number this value takes on the wire, author-supplied and never inferred — see `types/field.ts`'s own `FieldDefinition.number` for why. */
  readonly number: number;
}

/** A proto3 enum exactly as an {@link EnumWithName} resolved it. */
export interface DeclaredProtoEnum {
  /** Always `"enum"` — what a `ProtocolBuilder` reads to tell this apart from a `DeclaredMessage` or a `DeclaredRpcService` in the same array. */
  readonly kind: "enum";

  /** The name this enum is created under. */
  readonly name: string;

  /** The values this enum accepts, in the order `.values` gave them. The first always numbers `0`, proto3's own required default. */
  readonly values: UnmodifiableList<DeclaredEnumValue>;

  /** The numbers this enum retires from a previous version of the contract, refused to any {@link values} entry. */
  readonly reservedNumbers: UnmodifiableList<number>;

  /** The names this enum retires from a previous version of the contract, refused to any future {@link values} entry — nothing here checks that, since it is a fact about a version not yet written. */
  readonly reservedNames: UnmodifiableList<string>;
}

/** One value under construction, opened by {@link EnumValueFactory.value}, closed by {@link number}. */
export class EnumValueBuilder {
  readonly #name: string;

  /** Opened by {@link EnumValueFactory.value}, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** The number this value takes on the wire, closing it. */
  number(number: number): DeclaredEnumValue {
    return { name: this.#name, number };
  }
}

/** Opens one value of an enum, passed to {@link EnumWithName.values}'s own callback. */
export class EnumValueFactory {
  /** Names this value, closed by {@link EnumValueBuilder.number}. */
  value(name: string): EnumValueBuilder {
    return new EnumValueBuilder(name);
  }
}

/**
 * A proto3 enum that has taken its name, still open to {@link reserved}/{@link reservedNames},
 * closed by {@link values}.
 */
export class EnumWithName {
  readonly #name: string;
  #reservedNumbers: UnmodifiableList<number> = [];
  #reservedNames: UnmodifiableList<string> = [];

  /** Opened by {@link EnumFactory.name}, never directly. */
  constructor(name: string) {
    this.#name = name;
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
   * Closes this enum, resolving `build`'s own values into a {@link DeclaredProtoEnum}.
   *
   * @throws {Error} When no value was given, when the first value given does not number `0`, or
   * when a number repeats across two values or falls in a range this enum also reserves.
   */
  values(build: (v: EnumValueFactory) => UnmodifiableList<DeclaredEnumValue>): DeclaredProtoEnum {
    const values = build(new EnumValueFactory());

    if (values.length === 0 || values[0].number !== 0) {
      throw new Error(
        `Enum "${this.#name}" must open with a value numbered 0, proto3's own required default.`,
      );
    }

    const seen = new Set<number>();
    for (const entry of values) {
      if (seen.has(entry.number) || this.#reservedNumbers.includes(entry.number)) {
        throw new Error(
          `Enum "${this.#name}" reuses the number ${entry.number} across two values, or on a value this enum also reserves.`,
        );
      }
      seen.add(entry.number);
    }

    return {
      kind: "enum",
      name: this.#name,
      values,
      reservedNumbers: this.#reservedNumbers,
      reservedNames: this.#reservedNames,
    };
  }
}

/** Opens a proto3 enum type, passed to {@link ProtoEnum}'s own callback. */
export class EnumFactory {
  /** Names the enum, closed by {@link EnumWithName.values}. */
  name(name: string): EnumWithName {
    return new EnumWithName(name);
  }
}

/**
 * Declares a proto3 enum type, `build` naming it and listing its values.
 *
 * @example
 * ```ts ignore
 * ProtoEnum((e) =>
 *   e.name("LogLevel").values((v) => [
 *     v.value("LOG_LEVEL_UNSPECIFIED").number(0),
 *     v.value("LOG_LEVEL_DEBUG").number(1),
 *     v.value("LOG_LEVEL_INFO").number(2),
 *   ])
 * );
 * ```
 */
export function ProtoEnum(build: (e: EnumFactory) => DeclaredProtoEnum): DeclaredProtoEnum {
  return build(new EnumFactory());
}
