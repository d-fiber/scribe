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

/** One `rpc` of a {@link DeclaredRpcService}, exactly as {@link RpcServiceBuilder.rpc} recorded it. */
export interface DeclaredRpc {
  /** The name this procedure is declared under. */
  readonly name: string;

  /** The message this procedure takes, by name — declared elsewhere in this contract with `Message`, in either order. */
  readonly request: string;

  /** The message this procedure answers, by name — declared elsewhere in this contract with `Message`, in either order. */
  readonly response: string;
}

/** A proto3 `service` exactly as an {@link RpcServiceBuilder} resolved it. */
export interface DeclaredRpcService {
  /** Always `"service"` — what a `ProtocolBuilder` reads to tell this apart from a `DeclaredMessage` or a `DeclaredProtoEnum` in the same array. */
  readonly kind: "service";

  /** The name this service is created under. */
  readonly name: string;

  /** The procedures this service carries, in the order `.rpc` gave them. */
  readonly rpcs: UnmodifiableList<DeclaredRpc>;
}

/**
 * A proto3 `service` under construction, growing one `rpc` at a time.
 *
 * @remarks
 * Named `RpcService`/`RpcServiceBuilder` rather than `Service`/`ServiceBuilder`:
 * `iac/build/service.ts` already exports `Service` for a Docker service the deployed stack runs,
 * an entirely different thing this would otherwise collide with.
 *
 * Unlike `Message` or `ProtoEnum`, nothing here closes the chain with a call of its own: `.rpc`
 * always answers `this`, since nothing says in advance how many procedures a service will carry.
 * `ProtocolBuilder` reads {@link declaration} to resolve one of these into a
 * {@link DeclaredRpcService}, the same way it reads a `DeclaredMessage` or a `DeclaredProtoEnum`
 * directly — a service builder is simply the one of the three that never resolves itself along
 * the way.
 */
export class RpcServiceBuilder {
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

  /** This service, exactly as `.rpc` has built it so far — read by `ProtocolBuilder`, never called directly by an author. */
  get declaration(): DeclaredRpcService {
    return { kind: "service", name: this.#name, rpcs: [...this.#rpcs] };
  }
}

/**
 * Opens a proto3 `service` named `name`.
 *
 * @remarks
 * `protocol.md`'s own "Le sens de chaque service" gives the vocabulary a `.proto` file's `service`
 * block already carries in this repository: which direction a procedure travels, and who
 * implements it, is a fact about the two processes on either end, not something this builder
 * tracks. Only unary `rpc`s are expressible: the wire is not gRPC (`protocol.md`'s own "Le
 * transport n'est pas gRPC"), and none of the `.proto` files this mirrors declares a streaming one.
 *
 * @example
 * ```ts ignore
 * RpcService("Logging").rpc("Ship", "LogBatch", "LogAck");
 * ```
 */
export function RpcService(name: string): RpcServiceBuilder {
  return new RpcServiceBuilder(name);
}
