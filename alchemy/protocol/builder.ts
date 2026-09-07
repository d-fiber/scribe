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

import type { List } from "../primitives/value/list.ts";
import type { DeclaredMessage } from "./message/message.ts";
import { Message } from "./message/message.ts";
import type { DeclaredProtoEnum, EnumFactory } from "./types/enum.ts";
import { ProtoEnum } from "./types/enum.ts";
import type { DeclaredRpc } from "./service/service.ts";
import { RpcService, RpcServiceBuilder } from "./service/service.ts";
import type { FieldFactory, FieldMap } from "./types/field.ts";

/** A resolved message, named to match {@link ProtoEnumBuilder} and {@link ProtoServiceBuilder} even though `.fields(...)` already resolves it synchronously. */
export type ProtoMessageBuilder = DeclaredMessage;

/** A resolved enum, named to match {@link ProtoMessageBuilder} and {@link ProtoServiceBuilder}. */
export type ProtoEnumBuilder = DeclaredProtoEnum;

/** A service still open to `.rpc(...)`, the one of the three that stays a real builder once `this.builder(...)` answers it. */
export type ProtoServiceBuilder = RpcServiceBuilder;

/** Opens one procedure of a `.rpc((r) => [...])` array, passed to {@link ProtoNamedBuilder.rpc}'s own callback. */
export class RpcFactory {
  /** Names a procedure taking `request` and answering `response`, both message names declared elsewhere in the same contract. */
  rpc(name: string, request: string, response: string): DeclaredRpc {
    return { name, request, response };
  }
}

/**
 * A message or a service still waiting to know which one it is, opened by
 * {@link ProtoBuilder.builder} with a bare name.
 *
 * @remarks
 * `this.builder("Query")` cannot answer a message or a service outright: both open on the same
 * shape, a name, and nothing at the call site says which is meant. `.fields(...)` closes it as a
 * message, `.rpc(...)` closes it as a service — whichever is called decides, the same distinction
 * a `.proto` file only makes once it reads the block that follows the name.
 */
export class ProtoNamedBuilder {
  readonly #name: string;

  /** Opened by {@link ProtoBuilder.builder}, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /** Closes this name as a message — the same call `Message(name).fields(build)` already resolves to. */
  fields(build: (f: FieldFactory) => FieldMap): ProtoMessageBuilder {
    return Message(this.#name).fields(build);
  }

  /** Closes this name as a service, one procedure per entry `build` answers, in the order given. */
  rpc(build: (r: RpcFactory) => readonly DeclaredRpc[]): ProtoServiceBuilder {
    const service = RpcService(this.#name);
    for (const entry of build(new RpcFactory())) {
      service.rpc(entry.name, entry.request, entry.response);
    }
    return service;
  }
}

/**
 * What a `@Proto(...)` class extends, giving every `@ProtoMessage`/`@ProtoEnum`/`@ProtoService`
 * method the same `this.builder(...)` to open a node from.
 *
 * @remarks
 * An abstract class, not an interface: `this.builder(...)` needs a real method body to inherit,
 * which an interface alone never provides. `imports()` stays abstract, since only the class that
 * extends this one knows which `.proto` files it needs — never derived, the same reason a field
 * referencing another message's name is never checked either, see `types/field.ts`.
 */
export abstract class ProtoBuilder {
  /** The `.proto` files this contract needs an `import` for, by path — `"scribe/protocol/common.proto"` for example. */
  abstract imports(): List<string>;

  /** Opens a message or a service still waiting to know which one it is, named `name`. */
  protected builder(name: string): ProtoNamedBuilder;
  /** Opens an enum, named and filled by `build`. */
  protected builder(build: (e: EnumFactory) => DeclaredProtoEnum): ProtoEnumBuilder;
  /** The shared implementation behind both overloads above, dispatched on the argument's own type. */
  protected builder(
    nameOrBuild: string | ((e: EnumFactory) => DeclaredProtoEnum),
  ): ProtoNamedBuilder | ProtoEnumBuilder {
    return typeof nameOrBuild === "string" ? new ProtoNamedBuilder(nameOrBuild) : ProtoEnum(nameOrBuild);
  }
}
