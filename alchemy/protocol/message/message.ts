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
import { FieldFactory, fieldsOf } from "../types/field.ts";
import type { FieldDefinition, FieldMap } from "../types/field.ts";

/** A message exactly as a {@link MessageBuilder} resolved it. */
export interface DeclaredMessage {
  /** Always `"message"` — what a `ProtocolBuilder` reads to tell this apart from a `DeclaredProtoEnum` or a `DeclaredRpcService` in the same array. */
  readonly kind: "message";

  /** The name this message is created under. */
  readonly name: string;

  /** This message's fields, by field name, in the order `.fields` gave them. */
  readonly fields: Readonly<Record<string, FieldDefinition>>;

  /** The field numbers this message retires from a previous version of the contract, refused to any {@link fields} entry. */
  readonly reservedNumbers: UnmodifiableList<number>;

  /** The field names this message retires from a previous version of the contract, refused to any future {@link fields} entry — nothing here checks that, since it is a fact about a version not yet written. */
  readonly reservedNames: UnmodifiableList<string>;
}

/**
 * A proto3 message under construction, closed by {@link MessageBuilder.fields}.
 *
 * @remarks
 * A field opened in `.fields` can carry a reference to another message this contract declares, by
 * name, in either order: nothing here checks that the name it names exists, because a message can
 * be declared before the rest of the contract is known to exist — the same reason `schema/`'s own
 * `Table` never checks a foreign key's target either.
 */
export class MessageBuilder {
  readonly #name: string;
  #reservedNumbers: UnmodifiableList<number> = [];
  #reservedNames: UnmodifiableList<string> = [];

  /** Opened by `Message`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Retires `numbers` from a previous version of this message, refusing them to any field declared here. */
  reserved(numbers: UnmodifiableList<number>): this {
    this.#reservedNumbers = numbers;
    return this;
  }

  /** Retires `names` from a previous version of this message, refusing them to any field declared here in the future. */
  reservedNames(names: UnmodifiableList<string>): this {
    this.#reservedNames = names;
    return this;
  }

  /**
   * Closes this message, resolving `build`'s own fields into a {@link DeclaredMessage}.
   *
   * @throws {Error} When two fields share the same number, or when a field's number falls in a
   * range this message reserves.
   */
  fields(build: (f: FieldFactory) => FieldMap): DeclaredMessage {
    const fields = fieldsOf(build(new FieldFactory()));

    const seen = new Set<number>();
    for (const [fieldName, definition] of Object.entries(fields)) {
      if (seen.has(definition.number) || this.#reservedNumbers.includes(definition.number)) {
        throw new Error(
          `"${this.#name}" reuses the number ${definition.number} on field "${fieldName}", ` +
            "across two fields, or on a number this message also reserves.",
        );
      }
      seen.add(definition.number);
    }

    return {
      kind: "message",
      name: this.#name,
      fields,
      reservedNumbers: this.#reservedNumbers,
      reservedNames: this.#reservedNames,
    };
  }
}

/**
 * Opens a proto3 message named `name`, closed by {@link MessageBuilder.fields}.
 *
 * @example
 * ```ts ignore
 * Message("Time").fields((f) => ({ millis: f.int64().number(1) }));
 * ```
 */
export function Message(name: string): MessageBuilder {
  return new MessageBuilder(name);
}
