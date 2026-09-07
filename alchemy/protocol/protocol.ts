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

import { Future } from "../async/future.ts";
import type { UnmodifiableList } from "../value/list.ts";
import type { DeclaredMessage } from "./message/message.ts";
import { Message, MessageBuilder } from "./message/message.ts";
import type { DeclaredRpcService } from "./service/service.ts";
import { RpcService, RpcServiceBuilder } from "./service/service.ts";
import type { DeclaredProtoEnum } from "./types/enum.ts";
import { EnumFactory, ProtoEnum } from "./types/enum.ts";

/** One declaration a `protocol.builder` callback may return: a message, an enum, or a service — resolved or still under construction. */
export type ProtocolNode =
  | DeclaredMessage
  | DeclaredProtoEnum
  | RpcServiceBuilder;

/** One declaration exactly as `ProtocolBuilder` resolved it, `RpcServiceBuilder` read down to its own `DeclaredRpcService`. */
export type DeclaredNode =
  | DeclaredMessage
  | DeclaredProtoEnum
  | DeclaredRpcService;

/**
 * Opens every kind a `protocol.builder` callback can carry, passed to it as `b`.
 *
 * @remarks
 * Each method here is exactly its own top-level function — `b.message` and `Message` are the same
 * call, `b.enum` and `ProtoEnum` the same, `b.service` and `RpcService` the same — the same reason
 * `schema/schema.ts`'s own `SchemaContentFactory` exists: autocompletion on `b.` lists precisely
 * the three things a proto file can hold, without an author needing to import three separate names
 * from `@scribe/alchemy` to write one `build()` method.
 */
export class ProtocolContentFactory {
  /** Opens a proto3 message named `name`. Same call as the top-level `Message`. */
  message(name: string): MessageBuilder {
    return Message(name);
  }

  /** Declares a proto3 enum type. Same call as the top-level `ProtoEnum`. */
  enum(build: (e: EnumFactory) => DeclaredProtoEnum): DeclaredProtoEnum {
    return ProtoEnum(build);
  }

  /** Opens a proto3 `service` named `name`. Same call as the top-level `RpcService`. */
  service(name: string): RpcServiceBuilder {
    return RpcService(name);
  }
}

/**
 * Everything one `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class declared in its own
 * `build()`, sorted by kind and checked for a name reused across two declarations.
 *
 * @remarks
 * A message and an enum share one namespace, the same rule proto3 itself enforces: `messages` and
 * `enums` are refused a name in common, but a service may reuse a name either already took, since
 * proto3 keeps a service's own namespace separate.
 *
 * @throws {Error} When two declarations answered by the same `build()` callback share a name in
 * the namespace proto3 gives them, raised at construction, before `messages`/`enums`/`services`
 * answer anything.
 */
export class ProtocolBuilder {
  readonly #messages: DeclaredMessage[] = [];
  readonly #enums: DeclaredProtoEnum[] = [];
  readonly #services: DeclaredRpcService[] = [];

  /** Opened by `Protocol.builder`, never directly. */
  constructor(nodes: UnmodifiableList<ProtocolNode>) {
    const names = new Set<string>();
    const serviceNames = new Set<string>();

    for (const node of nodes) {
      const resolved: DeclaredNode = node instanceof RpcServiceBuilder ? node.declaration : node;

      if (resolved.kind === "service") {
        if (serviceNames.has(resolved.name)) {
          throw new Error(
            `"${resolved.name}" names two services in the same build().`,
          );
        }
        serviceNames.add(resolved.name);
        this.#services.push(resolved);
        continue;
      }

      if (names.has(resolved.name)) {
        throw new Error(
          `"${resolved.name}" names two messages or enums in the same build().`,
        );
      }
      names.add(resolved.name);

      if (resolved.kind === "message") {
        this.#messages.push(resolved);
      } else {
        this.#enums.push(resolved);
      }
    }
  }

  /** The messages this batch declared, in the order `build()` gave them. */
  get messages(): UnmodifiableList<DeclaredMessage> {
    return this.#messages;
  }

  /** The enums this batch declared, in the order `build()` gave them. */
  get enums(): UnmodifiableList<DeclaredProtoEnum> {
    return this.#enums;
  }

  /** The services this batch declared, in the order `build()` gave them. */
  get services(): UnmodifiableList<DeclaredRpcService> {
    return this.#services;
  }
}

/** The single entry point a `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class's own `build()` calls. */
export class Protocol {
  /**
   * Resolves `build`'s own declarations into a {@link ProtocolBuilder}.
   *
   * @remarks
   * Answers a `Future` rather than a `ProtocolBuilder` directly so that `build(): Future<ProtocolBuilder>`
   * on a `ProtocolSource` reads the same as `Init`/`Run`'s own handlers: a method a runner calls
   * later, even though resolving one of these carries no asynchronous work of its own today.
   */
  builder(
    build: (b: ProtocolContentFactory) => UnmodifiableList<ProtocolNode>,
  ): Future<ProtocolBuilder> {
    return Future.value(
      new ProtocolBuilder(build(new ProtocolContentFactory())),
    );
  }
}

/**
 * The one `Protocol` every `@CoreProtocol`/`@RuntimeProtocol`/`@ClientProtocol` class's own
 * `build()` calls — every file of it shares this same instance, the way `schema/schema.ts`'s own
 * `dbSchema` is shared across a package's `schema/`.
 */
export const protocol: Protocol = new Protocol();
