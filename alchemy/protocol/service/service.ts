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

/** One `rpc` of a {@link DeclaredRpcService}, exactly as {@link RpcServiceBuilder.rpc} recorded it. */
export interface DeclaredRpc {
  /** The name this procedure is declared under. */
  readonly name: string;

  /** The message this procedure takes, by name — declared elsewhere in this contract with `Message`, in either order. */
  readonly request: string;

  /** The message this procedure answers, by name — declared elsewhere in this contract with `Message`, in either order. */
  readonly response: string;
}

/** A proto3 `service` exactly as `RpcService` declared it. */
export interface DeclaredRpcService {
  /** The name this service is created under. */
  readonly name: string;

  /** The procedures this service carries, in the order `.rpc` gave them. */
  readonly rpcs: UnmodifiableList<DeclaredRpc>;
}

/** An RPC service, and the file it belongs to — not part of {@link DeclaredRpcService} itself, since which file a service belongs to is where it is filed, not a fact carried on the service. */
interface StoredRpcService {
  /** The file this service belongs to. */
  readonly file: ProtoFileRef;

  /** The service exactly as `RpcService` declared it. */
  readonly service: DeclaredRpcService;
}

/** Every service this contract has declared, by the name it took. */
const declared = new Registry<StoredRpcService>("service");

/**
 * A proto3 `service` under construction, growing one `rpc` at a time, declared once handed to a
 * `ContractFile`'s own `.with`.
 *
 * @remarks
 * Named `RpcService` rather than `Service`: `iac/build/service.ts` already exports `Service` for a
 * Docker service the deployed stack runs, an entirely different thing this would otherwise collide
 * with.
 *
 * `protocol.md`'s own "Le sens de chaque service" gives the vocabulary a `.proto` file's `service`
 * block already carries in this repository: which direction a procedure travels, and who implements
 * it, is a fact about the two processes on either end, not something this builder tracks — the same
 * reason `RpcService` here takes no parameter for it either. Only unary `rpc`s are expressible: the
 * wire is not gRPC (`protocol.md`'s own "Le transport n'est pas gRPC"), and none of the thirteen
 * `.proto` files this contract mirrors declares a streaming one.
 *
 * Unlike `Message`, nothing here closes the chain with a call of its own: `ContractFile`'s own
 * `.with` reads whatever `.rpc` last answered directly, so `RpcServiceBuilder` implements
 * {@link ContractAddable} itself — the same split `schema/schema.md` documents for its own `Enum`
 * and `Drop`, since nothing here says in advance how many procedures a service will carry.
 */
export class RpcServiceBuilder implements ContractAddable<DeclaredRpcService> {
  readonly #name: string;
  readonly #rpcs: DeclaredRpc[] = [];

  /** Opened by `RpcService`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Adds a procedure named `name`, taking `request` and answering `response`, both message names declared elsewhere in this contract with `Message`. */
  rpc(name: string, request: string, response: string): this {
    this.#rpcs.push({ name, request, response });
    return this;
  }

  /**
   * Registers this service for `file`, called by `ContractFile`'s own `.with`, never directly.
   *
   * @throws {DuplicateDeclarationError} When this service's name has already been declared.
   */
  declareInto(file: ProtoFileRef): DeclaredRpcService {
    const service: DeclaredRpcService = { name: this.#name, rpcs: this.#rpcs };
    return declared.declare(this.#name, { file, service }).service;
  }
}

/**
 * Opens a proto3 `service` named `name`.
 *
 * @example
 * ```ts ignore
 * contract.file("protocol/logs.proto", "scribe.v1").with((w) => [
 *   w.service("Logging").rpc("Ship", "LogBatch", "LogAck"),
 * ]);
 * ```
 */
export function RpcService(name: string): RpcServiceBuilder {
  return new RpcServiceBuilder(name);
}

/** Every service this contract has declared for `file`, in the order it declared them. */
export function declaredRpcServices(
  file: ProtoFileRef,
): UnmodifiableList<DeclaredRpcService> {
  return declared.all().filter((entry) => entry.file.path === file.path).map((
    entry,
  ) => entry.service);
}

/** Forgets every declared service, which is what a test does between cases. */
export function forgetRpcServices(): void {
  declared.forget();
}
