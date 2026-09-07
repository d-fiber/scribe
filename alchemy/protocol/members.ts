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

import type { ProtocolNode } from "./protocol.ts";

/**
 * The class-level slot every `@ProtoMessage`/`@ProtoEnum`/`@ProtoService` method writes into, at
 * the class's own `Symbol.metadata`.
 *
 * @remarks
 * A `Symbol.metadata` slot exists once per class, filled the moment each decorated method is
 * evaluated — no instance required, unlike `addInitializer`, which `wiring/declare/job.ts`'s own
 * `jobDecorator` relies on for `@Init`/`@Run`. That difference is deliberate:
 * `decorators.ts`'s own `Proto` never calls `new target()`, and a member decorator that needed an
 * instance to register itself would force that call, the same laziness `@Lifecycle` trades away
 * on purpose but `@Proto` does not.
 */
const PROTO_NODES = Symbol("protoNodes");

/** One method `@ProtoMessage`/`@ProtoEnum`/`@ProtoService` marked, not yet called. */
interface DecoratedNode {
  /** The method this node was declared under, named only for the error a caller raises. */
  readonly methodName: string;

  /** Calls the marked method on `self`, resolving it to the node it declares. */
  readonly resolve: (self: object) => ProtocolNode;
}

function entriesOf(metadata: DecoratorMetadata): DecoratedNode[] {
  return (metadata[PROTO_NODES] ??= []) as DecoratedNode[];
}

/**
 * Builds the method decorator behind `ProtoMessage`, `ProtoEnum` and `ProtoService` — each names
 * itself only to label the error this raises, the same split `jobDecorator` gives
 * `Init`/`Run`/`InitDB`/`MigrationDB`/`ProvisioningDB`.
 *
 * @throws {Error} When applied to anything but an instance method.
 */
function memberDecorator(decoratorName: string) {
  return function <This extends object, Fn extends (this: This) => ProtocolNode>(
    target: Fn,
    context: ClassMethodDecoratorContext<This, Fn>,
  ): void {
    if (context.kind !== "method" || context.static) {
      throw new Error(
        `@${decoratorName}() on "${String(context.name)}": only an instance method can be marked.`,
      );
    }

    entriesOf(context.metadata).push({
      methodName: String(context.name),
      resolve: (self) => target.call(self as This),
    });
  };
}

/**
 * Marks an instance method as declaring one message of the contract its class belongs to.
 *
 * @remarks
 * The method takes no arguments and returns the {@link ProtoMessageBuilder} `this.builder(name)
 * .fields(...)` already resolves to — this decorator changes nothing about how a message is
 * written, only where it is collected from. A class carries as many `@ProtoMessage()` methods as
 * it has messages to declare; two returning the same message name collide the same way two
 * entries of a `protocol.builder` array would, caught by `ProtocolBuilder`'s own constructor once
 * something reads {@link declaredNodes}.
 *
 * ```ts ignore
 * @ProtoMessage()
 * query(): ProtoMessageBuilder {
 *   return this.builder("Query").fields((f) => ({ sql: f.string().number(1) }));
 * }
 * ```
 */
export function ProtoMessage() {
  return memberDecorator("ProtoMessage");
}

/**
 * Marks an instance method as declaring one enum of the contract its class belongs to.
 *
 * @remarks
 * Free to take this name because nothing else in the shared `mod.ts` barrel claims it any more:
 * the raw value-level opener `types/enum.ts` used to export under `ProtoEnum` is now reached only
 * through `this.builder(...)` or `ProtocolContentFactory.enum(...)`, never imported by that name
 * directly — the same reason `RpcService` avoided colliding with `Service` by choosing a different
 * name instead, except here the collision was closed by retiring the other export.
 *
 * ```ts ignore
 * @ProtoEnum()
 * sortOrder(): ProtoEnumBuilder {
 *   return this.builder((e) =>
 *     e.name("SortOrder").values((v) => [v.value("SORT_ORDER_UNSPECIFIED").number(0)])
 *   );
 * }
 * ```
 */
export function ProtoEnum() {
  return memberDecorator("ProtoEnum");
}

/**
 * Marks an instance method as declaring one service of the contract its class belongs to.
 *
 * @remarks
 * The method returns the open {@link ProtoServiceBuilder} `this.builder(name).rpc(...)` already
 * answers, resolved later by `ProtocolBuilder`'s own constructor.
 *
 * ```ts ignore
 * @ProtoService()
 * database(): ProtoServiceBuilder {
 *   return this.builder("Database").rpc((r) => [r.name("Execute").request("Query").response("QueryResult")]);
 * }
 * ```
 */
export function ProtoService() {
  return memberDecorator("ProtoService");
}

/**
 * Every node a `@ProtoMessage`/`@ProtoEnum`/`@ProtoService` method declared on `instance`'s own
 * class, resolved in the order those methods appear in the class body.
 *
 * @remarks
 * Reads `instance.constructor`'s own `Symbol.metadata`, filled at class definition, not at
 * `instance`'s construction — the same slot every decorated method already wrote into. A class
 * never calls this itself: a generation step reads {@link declaredProtocols}, builds one instance
 * of each registered class, and calls this once per instance to feed `protocol.builder`:
 *
 * ```ts ignore
 * const built = await protocol.builder(() => declaredNodes(new entry.source()));
 * ```
 */
export function declaredNodes(instance: object): ProtocolNode[] {
  const metadata = (instance.constructor as { [Symbol.metadata]?: DecoratorMetadata })[Symbol.metadata];
  return metadata ? entriesOf(metadata).map((entry) => entry.resolve(instance)) : [];
}
