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
 * The `.proto` file a declaration renders into: its output path, and the proto `package` its
 * messages, enums and services are declared under.
 *
 * @remarks
 * `schema/moment.ts` has three fixed values here, `init`/`migrations`/`provisioning`, because a
 * table or an enum genuinely picks between three moments a package's own database goes through.
 * A `.proto` file has no such closed choice: each one is its own standalone unit, so `path` and
 * `package` are open strings a caller supplies through `Contract.file`, not a member of a fixed
 * union.
 */
export interface ProtoFileRef {
  /** The path this file renders to, relative to the repository root — `"protocol/logs.proto"`, `"packages/search/protocol/search.proto"`. */
  readonly path: string;

  /** The proto `package` every message, enum and service in this file is declared under. */
  readonly package: string;
}

/**
 * A declaration that has everything it needs but the file it renders into, answered once
 * `ContractFile`'s own `.with` gives it one.
 *
 * @remarks
 * Every kind under `protocol/` — `Message`, `ProtoEnum`, `RpcService` — satisfies this once its own
 * chain reaches the point that used to register it outright, the same reason `schema/moment.ts`'s
 * own `SchemaAddable` exists. `declareInto` is called by `ContractFile` alone, once, and never by
 * the package that wrote the declaration.
 */
export interface ContractAddable<T> {
  /** Registers this declaration for `file`, and answers the value it declares. */
  declareInto(file: ProtoFileRef): T;
}

/**
 * The shared shape behind a terminal call that used to register its declaration outright and now
 * waits on `ContractFile` instead — `Message`'s own `.fields` answers one of these.
 *
 * @remarks
 * `ProtoEnum` and `RpcService` have no terminal call built the same way — a value still under
 * construction, itself, is what a `ContractFile` batch carries for them — so `ProtoEnumBuilder` and
 * `RpcServiceBuilder` implement {@link ContractAddable} directly, rather than answering one of
 * these, the same split `schema/moment.ts`'s own `SchemaEntry` documents for `Enum` and `Drop`.
 */
export class ContractEntry<T> implements ContractAddable<T> {
  readonly #finish: (file: ProtoFileRef) => T;

  /** Wraps `finish`, called once with the file `ContractFile` chose. */
  constructor(finish: (file: ProtoFileRef) => T) {
    this.#finish = finish;
  }

  /** Runs the deferred registration this entry wraps, for `file`, and answers what it declares. */
  declareInto(file: ProtoFileRef): T {
    return this.#finish(file);
  }
}
