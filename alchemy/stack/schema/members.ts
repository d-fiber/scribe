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
import type { DbMoment, SchemaMember } from "./moment.ts";

/**
 * The class-level slot every `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` method writes
 * into, at the class's own `Symbol.metadata` — the same mechanism `alchemy/protocol/members.ts`'s
 * own `PROTO_NODES` uses, and for the same reason: no instance is required to fill it, unlike
 * `addInitializer`, which would force `@Schema` to call `new target()` the moment it decorates a
 * class, the laziness `@Lifecycle` trades away on purpose but neither `@Proto` nor `@Schema` do.
 */
const SCHEMA_MEMBERS = Symbol("schemaMembers");

/** One method `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` marked, not yet called. */
interface DecoratedMember {
  /** The method this member was declared under, named only for the error a caller raises. */
  readonly methodName: string;

  /** The moment this member declares for, fixed by which of the three decorators marked it. */
  readonly moment: DbMoment;

  /** Calls the marked method on `self`, resolving it to the member it declares. */
  readonly resolve: (self: object) => SchemaMember;
}

function entriesOf(metadata: DecoratorMetadata): DecoratedMember[] {
  return (metadata[SCHEMA_MEMBERS] ??= []) as DecoratedMember[];
}

/**
 * Builds the method decorator behind `SchemaInit`, `SchemaMigration` and `SchemaProvisioning` —
 * each names itself only to label the error this raises, the same split `memberDecorator` gives
 * `ProtoMessage`/`ProtoEnum`/`ProtoService` in `alchemy/protocol/members.ts`.
 *
 * @throws {Error} When applied to anything but an instance method.
 */
function memberDecorator(moment: DbMoment, decoratorName: string) {
  return function <This extends object, Fn extends (this: This) => SchemaMember>(
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
      moment,
      resolve: (self) => target.call(self as This),
    });
  };
}

/**
 * Marks an instance method as declaring, for the `init` moment, whatever a `Table`, `Sequence`,
 * `Enum`, `Type`, `Extension`, `Grant` or `Drop` this method answers builds.
 *
 * @remarks
 * `init` is played once against the package's own schema. This decorator changes nothing about how
 * a table or an enum is written, only where it is collected from and which moment it renders under
 * — `schema.ts`'s own collection step reads it once something calls one of its `declared*`
 * functions, never the method itself.
 *
 * ```ts ignore
 * @SchemaInit()
 * accounts(): UnmodifiableList<SchemaNode> {
 *   return Table("__accounts__").columns((c) => ({ id: c.uuid().isPrimary() }));
 * }
 * ```
 */
export function SchemaInit() {
  return memberDecorator("init", "SchemaInit");
}

/**
 * Marks an instance method as declaring, for the `migrations` moment, whatever a `Table`,
 * `Sequence`, `Enum`, `Type`, `Extension`, `Grant` or `Drop` this method answers builds.
 *
 * @remarks
 * `migrations` is applied once each, through `dbmate`, as the package evolves.
 *
 * ```ts ignore
 * @SchemaMigration()
 * retireLegacySessions(): DropDeclaration {
 *   return Drop("__legacy_sessions__").table().cascade();
 * }
 * ```
 */
export function SchemaMigration() {
  return memberDecorator("migrations", "SchemaMigration");
}

/**
 * Marks an instance method as declaring, for the `provisioning` moment, whatever a `Table`,
 * `Sequence`, `Enum`, `Type`, `Extension`, `Grant` or `Drop` this method answers builds.
 *
 * @remarks
 * `provisioning` is played once, before the package's own schema exists.
 *
 * ```ts ignore
 * @SchemaProvisioning()
 * trigram(): SchemaNode {
 *   return Extension("pg_trgm").install();
 * }
 * ```
 */
export function SchemaProvisioning() {
  return memberDecorator("provisioning", "SchemaProvisioning");
}

/**
 * Every member a `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` method declared on
 * `instance`'s own class, resolved in the order those methods appear in the class body, alongside
 * the moment each one was marked for.
 *
 * @remarks
 * Reads `instance.constructor`'s own `Symbol.metadata`, filled at class definition, not at
 * `instance`'s construction — the same slot every decorated method already wrote into. A class
 * never calls this itself: `schema.ts`'s own collection step reads {@link declaredSchemas}, builds
 * one instance of each registered class, and calls this once per instance. What a `Table`'s own
 * `.columns()` answers, several nodes at once, and what an `Enum`'s own `.value()` or a `Drop`'s own
 * `.cascade()` answers, a builder still open to further calls, are both left exactly as the method
 * returned them — resolving either into plain {@link SchemaNode}s is `schema.ts`'s own job, not
 * this one's, the same split `alchemy/protocol/members.ts`'s own `declaredNodes` keeps from
 * `ProtocolBuilder`.
 */
export function declaredSchemaMembers(
  instance: object,
): UnmodifiableList<{ readonly moment: DbMoment; readonly member: SchemaMember }> {
  const metadata = (instance.constructor as { [Symbol.metadata]?: DecoratorMetadata })[Symbol.metadata];
  return metadata
    ? entriesOf(metadata).map((entry) => ({ moment: entry.moment, member: entry.resolve(instance) }))
    : [];
}
