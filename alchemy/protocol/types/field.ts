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

/**
 * A proto3 scalar kind, spelled the way a `.proto` file takes it.
 *
 * @remarks
 * The fifteen proto3 ships. Nothing here is left open the way `ExtensionName` or `PolicyRole` are
 * in `schema/`: proto3 itself does not grow a sixteenth scalar kind the way a Postgres extension
 * can add an index access method, so a closed union costs nothing here.
 */
export type ScalarKind =
  | "double"
  | "float"
  | "int32"
  | "int64"
  | "uint32"
  | "uint64"
  | "sint32"
  | "sint64"
  | "fixed32"
  | "fixed64"
  | "sfixed32"
  | "sfixed64"
  | "bool"
  | "string"
  | "bytes";

/**
 * The scalar kinds proto3 allows as a `map`'s key type: every integral kind, plus `bool` and
 * `string`. `double`, `float` and `bytes` are refused by proto3 itself, and so is an `enum` or a
 * `message` key, which is why {@link FieldFactory.map} takes this rather than {@link ScalarKind}.
 */
export type MapKeyKind = Exclude<ScalarKind, "double" | "float" | "bytes">;

/**
 * The proto3 type a field holds, closed to what {@link FieldFactory} and {@link MapValueFactory}
 * open.
 *
 * @remarks
 * `enum` and `message` name another declaration by its key rather than holding it, the same choice
 * `schema/types/column.ts`'s own `ColumnType` makes for `{ kind: "enum", name }` and `{ kind:
 * "composite", name }`: a field can be declared before the rest of the contract is known to exist,
 * so nothing here checks that the name it took resolves. Whatever renders the `.proto` text is what
 * refuses a name that resolves to nothing, and is also what derives the `import` a cross-file
 * reference needs — see `protocol.md`'s own section on imports.
 */
export type FieldType =
  | { readonly kind: "scalar"; readonly scalar: ScalarKind }
  | { readonly kind: "enum"; readonly name: string }
  | { readonly kind: "message"; readonly name: string }
  | { readonly kind: "repeated"; readonly of: FieldType }
  | {
    readonly kind: "map";
    readonly key: MapKeyKind;
    readonly value: FieldType;
  };

/** A field exactly as a {@link FieldBuilder} or a {@link MapFieldBuilder} resolved it, read by whatever assembles the `.proto` text it describes. */
export interface FieldDefinition {
  /** The proto3 type this field holds. */
  readonly type: FieldType;

  /**
   * The field number this field takes on the wire.
   *
   * @remarks
   * Never inferred from where the field sits in the object a `.fields` callback returns: proto3
   * numbers are stable for the life of the contract, and a number this module derived from source
   * order would silently renumber the wire on the first reordering — the exact hazard
   * `protocol.md` names for why a TypeScript source was once refused as a generator input at all.
   * `.number(n)` is the one call every {@link FieldBuilder} and {@link MapFieldBuilder} must make
   * before {@link FieldMap} accepts it, enforced by the type parameter each carries, not by
   * documentation.
   */
  readonly number: number;

  /** Whether this field carries proto3's explicit presence tracking (`optional`), distinguishing "never set" from "set to the zero value". */
  readonly optional: boolean;
}

/** The highest field number proto3 allows, past which the wire format has no room left to encode one. */
const MAX_FIELD_NUMBER = 536_870_911;

/** The range proto3 reserves for its own implementation, refused to every field. */
const RESERVED_FIELD_NUMBERS: readonly [start: number, end: number] = [19_000, 19_999];

/**
 * Refuses a field number proto3 itself would refuse, the same check `protoc` runs once a `.proto`
 * reaches it — run here instead, at the call that names the number, so a typo surfaces where it
 * was made rather than the day a renderer finally emits text for `protoc` to read.
 *
 * @throws {Error} When `tag` is not a positive integer, exceeds {@link MAX_FIELD_NUMBER}, or falls
 * inside {@link RESERVED_FIELD_NUMBERS}.
 */
function validateFieldNumber(tag: number): void {
  if (!Number.isInteger(tag) || tag < 1 || tag > MAX_FIELD_NUMBER) {
    throw new Error(
      `${tag} is not a valid proto3 field number: it must be an integer between 1 and ${MAX_FIELD_NUMBER}.`,
    );
  }

  const [start, end] = RESERVED_FIELD_NUMBERS;
  if (tag >= start && tag <= end) {
    throw new Error(
      `${tag} falls inside ${start}-${end}, the range proto3 reserves for its own implementation.`,
    );
  }
}

/**
 * A field under construction, opened by one of {@link FieldFactory}'s type methods and refined by
 * {@link repeated}, {@link optional} and finally {@link number}, in any order before the last one.
 *
 * @remarks
 * `HasNumber` tracks whether {@link number} was called, the same reason `schema/table/table.ts`'s
 * own `TableForeignKeyBuilder` carries a `HasReference` — see that class's own remarks for why a
 * `this`-typed {@link build} alone would not be enough to refuse an unnumbered field where
 * {@link FieldMap} is written, only where it is read back. A field never carries its own name: the
 * property key a `.fields` callback gives it is the name, the same choice `schema/table/table.ts`'s
 * own `ColumnMap` makes for a column.
 */
export class FieldBuilder<HasNumber extends boolean = false> {
  /** A phantom marker, never read or assigned, so `HasNumber` forces `FieldBuilder<false>` and `FieldBuilder<true>` apart — see `TableForeignKeyBuilder.hasReference` in `schema/table/table.ts` for why a `this`-typed method alone could not. */
  declare private readonly hasNumber: HasNumber;

  readonly #base: FieldType;
  #repeated = false;
  #optional = false;
  #number?: number;

  /** Opened by one of {@link FieldFactory}'s type methods, never directly. */
  constructor(base: FieldType) {
    this.#base = base;
  }

  /** Makes this field a `repeated` list of its type, rather than one value of it. Refused by proto3 alongside {@link optional} on the same field, a rule nothing here enforces. */
  repeated(): this {
    this.#repeated = true;
    return this;
  }

  /** Turns on proto3's explicit presence tracking for this field, distinguishing "never set" from "set to the zero value". Refused by proto3 alongside {@link repeated} on the same field, a rule nothing here enforces. */
  optional(): this {
    this.#optional = true;
    return this;
  }

  /**
   * The field number this field takes on the wire, closing the chain: {@link FieldMap} only
   * accepts a field once this has been called.
   *
   * @remarks
   * Always the author's own choice, never derived — see {@link FieldDefinition.number}'s own
   * remarks for why. Nothing here refuses a number already taken by another field in the same
   * message, or one that message also reserves: that check belongs to `Message.fields`, the same
   * place `schema/table/table.ts`'s own `.columns` refuses a composite primary key declared twice,
   * once every field of the message is known at once.
   *
   * @throws {Error} When `tag` falls outside the range proto3 allows a field number, or inside the
   * range it reserves for itself — see {@link validateFieldNumber}.
   */
  number(this: FieldBuilder<boolean>, tag: number): FieldBuilder<true> {
    validateFieldNumber(tag);
    this.#number = tag;
    return this as unknown as FieldBuilder<true>;
  }

  /** This field, exactly as `Message` reads it once its own `.fields` callback returns. */
  build(this: FieldBuilder<true>): FieldDefinition {
    return {
      type: this.#repeated ? { kind: "repeated", of: this.#base } : this.#base,
      number: this.#number as number,
      optional: this.#optional,
    };
  }
}

/**
 * A `map<K, V>` field under construction, opened by {@link FieldFactory.map} and closed by
 * {@link number}.
 *
 * @remarks
 * Kept apart from {@link FieldBuilder} rather than folded into it as one more {@link FieldType}
 * variant with its own modifiers, because a map field carries neither {@link FieldBuilder.repeated}
 * nor {@link FieldBuilder.optional} — proto3 refuses both on a map, which is already a repeated
 * key/value pair under the hood — so there is nothing here for either method to do, the same reason
 * `schema/types/column.ts`'s own `.collation` and `.identity` live on a narrower subclass rather
 * than a bare `ColumnBuilder`.
 */
export class MapFieldBuilder<HasNumber extends boolean = false> {
  /** A phantom marker, never read or assigned, so `HasNumber` forces `MapFieldBuilder<false>` and `MapFieldBuilder<true>` apart — see `FieldBuilder.hasNumber` above for why a `this`-typed method alone could not. */
  declare private readonly hasNumber: HasNumber;

  readonly #key: MapKeyKind;
  readonly #value: FieldType;
  #number?: number;

  /** Opened by {@link FieldFactory.map}, never directly. */
  constructor(key: MapKeyKind, value: FieldType) {
    this.#key = key;
    this.#value = value;
  }

  /**
   * The field number this field takes on the wire, closing the chain — see
   * {@link FieldBuilder.number}'s own remarks, which apply here unchanged.
   *
   * @throws {Error} When `tag` falls outside the range proto3 allows a field number, or inside the
   * range it reserves for itself — see {@link validateFieldNumber}.
   */
  number(this: MapFieldBuilder<boolean>, tag: number): MapFieldBuilder<true> {
    validateFieldNumber(tag);
    this.#number = tag;
    return this as unknown as MapFieldBuilder<true>;
  }

  /** This field, exactly as `Message` reads it once its own `.fields` callback returns. */
  build(this: MapFieldBuilder<true>): FieldDefinition {
    return {
      type: { kind: "map", key: this.#key, value: this.#value },
      number: this.#number as number,
      optional: false,
    };
  }
}

/**
 * Opens the value type of a `map<K, V>` field, passed to {@link FieldFactory.map}'s own callback.
 *
 * @remarks
 * Answers a bare {@link FieldType} rather than a {@link FieldBuilder}: a map's value can be neither
 * `repeated` nor `optional` on its own, proto3's own rule for why `MapFieldBuilder` carries neither
 * either, so there is no builder here to close — the type itself is already the finished answer.
 */
export class MapValueFactory {
  #scalar(scalar: ScalarKind): FieldType {
    return { kind: "scalar", scalar };
  }

  /** A `double` value. */
  double(): FieldType {
    return this.#scalar("double");
  }

  /** A `float` value. */
  float(): FieldType {
    return this.#scalar("float");
  }

  /** An `int32` value. */
  int32(): FieldType {
    return this.#scalar("int32");
  }

  /** An `int64` value. */
  int64(): FieldType {
    return this.#scalar("int64");
  }

  /** A `uint32` value. */
  uint32(): FieldType {
    return this.#scalar("uint32");
  }

  /** A `uint64` value. */
  uint64(): FieldType {
    return this.#scalar("uint64");
  }

  /** A `sint32` value, zigzag-encoded — cheaper than `int32` for a field that is often negative. */
  sint32(): FieldType {
    return this.#scalar("sint32");
  }

  /** A `sint64` value, zigzag-encoded — cheaper than `int64` for a field that is often negative. */
  sint64(): FieldType {
    return this.#scalar("sint64");
  }

  /** A `fixed32` value — cheaper than `uint32` on the wire for a value usually larger than 2^28. */
  fixed32(): FieldType {
    return this.#scalar("fixed32");
  }

  /** A `fixed64` value — cheaper than `uint64` on the wire for a value usually larger than 2^56. */
  fixed64(): FieldType {
    return this.#scalar("fixed64");
  }

  /** An `sfixed32` value, the signed counterpart of `fixed32`. */
  sfixed32(): FieldType {
    return this.#scalar("sfixed32");
  }

  /** An `sfixed64` value, the signed counterpart of `fixed64`. */
  sfixed64(): FieldType {
    return this.#scalar("sfixed64");
  }

  /** A `bool` value. */
  bool(): FieldType {
    return this.#scalar("bool");
  }

  /** A `string` value, UTF-8. */
  string(): FieldType {
    return this.#scalar("string");
  }

  /** A `bytes` value, an uninterpreted byte string. */
  bytes(): FieldType {
    return this.#scalar("bytes");
  }

  /** An `enum` value, typed as the enum `name` names, declared elsewhere in this contract with `ProtoEnum`. */
  enum(name: string): FieldType {
    return { kind: "enum", name };
  }

  /** A `message` value, typed as the message `name` names, declared elsewhere in this contract with `Message`. */
  message(name: string): FieldType {
    return { kind: "message", name };
  }
}

/**
 * Opens a field of one proto3 type, refined by whichever {@link FieldBuilder} modifiers `Message`'s
 * own `.fields` callback chain onto it.
 *
 * @example
 * ```ts ignore
 * w.message("Request").fields((f) => ({
 *   method: f.enum("Method").number(1),
 *   headers: f.map("string", (v) => v.string()).number(5),
 *   body: f.bytes().number(6),
 * }));
 * ```
 */
export class FieldFactory {
  #scalar(scalar: ScalarKind): FieldBuilder {
    return new FieldBuilder({ kind: "scalar", scalar });
  }

  /** Opens a `double` field. */
  double(): FieldBuilder {
    return this.#scalar("double");
  }

  /** Opens a `float` field. */
  float(): FieldBuilder {
    return this.#scalar("float");
  }

  /** Opens an `int32` field. */
  int32(): FieldBuilder {
    return this.#scalar("int32");
  }

  /** Opens an `int64` field. */
  int64(): FieldBuilder {
    return this.#scalar("int64");
  }

  /** Opens a `uint32` field. */
  uint32(): FieldBuilder {
    return this.#scalar("uint32");
  }

  /** Opens a `uint64` field. */
  uint64(): FieldBuilder {
    return this.#scalar("uint64");
  }

  /** Opens a `sint32` field, zigzag-encoded — cheaper than `int32` for a field that is often negative. */
  sint32(): FieldBuilder {
    return this.#scalar("sint32");
  }

  /** Opens a `sint64` field, zigzag-encoded — cheaper than `int64` for a field that is often negative. */
  sint64(): FieldBuilder {
    return this.#scalar("sint64");
  }

  /** Opens a `fixed32` field — cheaper than `uint32` on the wire for a value usually larger than 2^28. */
  fixed32(): FieldBuilder {
    return this.#scalar("fixed32");
  }

  /** Opens a `fixed64` field — cheaper than `uint64` on the wire for a value usually larger than 2^56. */
  fixed64(): FieldBuilder {
    return this.#scalar("fixed64");
  }

  /** Opens an `sfixed32` field, the signed counterpart of `fixed32`. */
  sfixed32(): FieldBuilder {
    return this.#scalar("sfixed32");
  }

  /** Opens an `sfixed64` field, the signed counterpart of `fixed64`. */
  sfixed64(): FieldBuilder {
    return this.#scalar("sfixed64");
  }

  /** Opens a `bool` field. */
  bool(): FieldBuilder {
    return this.#scalar("bool");
  }

  /** Opens a `string` field, UTF-8. */
  string(): FieldBuilder {
    return this.#scalar("string");
  }

  /** Opens a `bytes` field, an uninterpreted byte string. */
  bytes(): FieldBuilder {
    return this.#scalar("bytes");
  }

  /** Opens a field typed as the enum `name` names, declared elsewhere in this contract with `ProtoEnum`. */
  enum(name: string): FieldBuilder {
    return new FieldBuilder({ kind: "enum", name });
  }

  /** Opens a field typed as the message `name` names, declared elsewhere in this contract with `Message`. */
  message(name: string): FieldBuilder {
    return new FieldBuilder({ kind: "message", name });
  }

  /**
   * Opens a `map<key, V>` field, `V` built by `build` from the {@link MapValueFactory} it receives.
   *
   * @remarks
   * `key` is a {@link MapKeyKind}, not a full {@link FieldBuilder} chain: proto3 refuses a `float`,
   * `double`, `bytes`, `enum` or `message` key outright, so there is nothing to build for it beyond
   * naming which of the eleven legal kinds it is.
   */
  map(
    key: MapKeyKind,
    build: (v: MapValueFactory) => FieldType,
  ): MapFieldBuilder {
    return new MapFieldBuilder(key, build(new MapValueFactory()));
  }
}

/** What `Message` takes for its fields: a field builder, closed by its own `.number(...)`, by the name it holds under. */
export type FieldMap = Record<
  string,
  FieldBuilder<true> | MapFieldBuilder<true>
>;

/** A {@link FieldMap} turned into what a message carries, by field name. */
export function fieldsOf(fields: FieldMap): Record<string, FieldDefinition> {
  const resolved: Record<string, FieldDefinition> = {};

  for (const [name, builder] of Object.entries(fields)) {
    resolved[name] = builder instanceof MapFieldBuilder ? builder.build() : builder.build();
  }

  return resolved;
}
