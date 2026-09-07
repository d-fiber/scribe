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

import type { UnmodifiableList } from "../value/list.ts";
import { Message, MessageBuilder } from "./message/message.ts";
import type { ContractAddable, ProtoFileRef } from "./file.ts";
import { RpcService, RpcServiceBuilder } from "./service/service.ts";
import { ProtoEnum, ProtoEnumBuilder } from "./types/enum.ts";

/**
 * Opens every kind a `ContractFile` batch can carry, passed to {@link ContractFile.with}'s own
 * callback.
 *
 * @remarks
 * Each method here is exactly its own top-level function — `w.message` and `Message` are the same
 * call, `w.enum` and `ProtoEnum` the same, `w.service` and `RpcService` the same — the same reason
 * `schema/schema.ts`'s own `SchemaContentFactory` exists: autocompletion on `w.` lists precisely the
 * three things a `.proto` file can hold, without a package author needing to import three separate
 * names from `@scribe/alchemy` to write one file.
 */
export class ContractContentFactory {
  /** Opens a proto3 message named `name`. Same call as the top-level `Message`. */
  message(name: string): MessageBuilder {
    return Message(name);
  }

  /** Opens a proto3 enum type named `name`. Same call as the top-level `ProtoEnum`. */
  enum(name: string): ProtoEnumBuilder {
    return ProtoEnum(name);
  }

  /** Opens a proto3 `service` named `name`. Same call as the top-level `RpcService`. */
  service(name: string): RpcServiceBuilder {
    return RpcService(name);
  }
}

/**
 * One `.proto` file, opened by {@link Contract.file}, closed by {@link with}.
 *
 * @remarks
 * `schema/schema.ts`'s own `SchemaBatch` exists because seven kinds of SQL declaration must each
 * choose between three moments a package's own database goes through — a real ambiguity, resolved
 * once for the whole batch. A `.proto` file carries no such ambiguity: `Contract.file` already names
 * the one file every declaration in `.with`'s own array renders into, so this exists for the same
 * reason `SchemaBatch` does — one place that finally pushes into the right registry — without a
 * moment to pick between.
 */
export class ContractFile {
  readonly #file: ProtoFileRef;

  /** Opened by {@link Contract.file}, never directly. */
  constructor(file: ProtoFileRef) {
    this.#file = file;
  }

  /**
   * Declares everything `build` answers, in the order it lists them, for this file.
   *
   * @remarks
   * A `Message`, a `ProtoEnum` or an `RpcService` no longer says its own file: none of the three
   * registers anything by itself any more, so a value one of them built but never listed here is a
   * declaration nobody ever sees, the same as any other value nothing reads. `w`, the callback's own
   * argument, is a shortcut to the same three top-level functions, so nothing under `protocol/`
   * needs importing by name to write one file.
   */
  with(
    build: (
      w: ContractContentFactory,
    ) => UnmodifiableList<ContractAddable<unknown>>,
  ): void {
    for (const entry of build(new ContractContentFactory())) {
      entry.declareInto(this.#file);
    }
  }
}

/**
 * The single entry point for a `.proto` file written in TypeScript, one call per file.
 *
 * @example
 * ```ts ignore
 * contract.file("protocol/common.proto", "scribe.v1").with((w) => [
 *   w.message("Time").fields((f) => ({ millis: f.int64().number(1) })),
 *   w.enum("Caller")
 *     .value("CALLER_UNSPECIFIED", 0)
 *     .value("CALLER_ANONYMOUS", 1),
 * ]);
 * ```
 */
export class Contract {
  /**
   * Opens the `.proto` file at `path`, under the proto `package` `pkg`, closed by
   * {@link ContractFile.with}.
   *
   * @remarks
   * `path` and `pkg` are both required here rather than deduced from where the TypeScript module
   * that calls this lives: a `.proto` file's own output path and its declared `package` are facts
   * about the contract the framework and every worker language agree on, the same reason a table's
   * name in `schema/` is a string the author chose rather than a key derived from a file path.
   */
  file(path: string, pkg: string): ContractFile {
    return new ContractFile({ path, package: pkg });
  }
}

/**
 * The one `Contract` every `alchemy/protocol/**\/*.ts` file writes against — every file of it
 * shares this same instance, the way `schema/schema.ts`'s own `dbSchema` is shared across a
 * package's `schema/`.
 */
export const contract: Contract = new Contract();
