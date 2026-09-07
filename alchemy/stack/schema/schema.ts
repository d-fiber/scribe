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

import { Registry } from "../../wiring/declare/registry.ts";
import type { UnmodifiableList } from "../../primitives/value/list.ts";
import type { DeclaredGrant } from "./access/grant.ts";
import { declaredSchemas } from "./decorators.ts";
import type { DeclaredDrop } from "./lifecycle/drop.ts";
import { DropDeclaration } from "./lifecycle/drop.ts";
import { declaredSchemaMembers } from "./members.ts";
import type { DbMoment, SchemaNode } from "./moment.ts";
import type { DeclaredExtension } from "./objects/extension.ts";
import type { DeclaredSequence } from "./objects/sequence.ts";
import type { DeclaredIndex, DeclaredPolicy, DeclaredTable } from "./table/table.ts";
import { EnumBuilder } from "./types/enum.ts";
import type { DeclaredEnum } from "./types/enum.ts";
import type { DeclaredType } from "./types/type.ts";

/** One {@link SchemaNode}, alongside the moment the method that answered it was marked for. */
interface PlacedNode {
  /** The moment this node renders under. */
  readonly moment: DbMoment;

  /** What was declared. */
  readonly node: SchemaNode;
}

/**
 * Every node every `@Schema` class across a package's own `db` schema declared, in declaration
 * order: one instance per {@link declaredSchemas} entry, one call to `declaredSchemaMembers` per instance,
 * `Table`'s own several-nodes-at-once and `Enum`/`Drop`'s own still-open builders resolved here —
 * the same job `alchemy/protocol/protocol.ts`'s own `ProtocolBuilder` does for a single class's
 * `build()`, run instead across every class a whole package declares, since a table's name must
 * still refuse a duplicate regardless of which file, or which of the three moments, declared it
 * twice.
 *
 * @remarks
 * Recomputed on every call, from {@link declaredSchemas} as it stands right now: nothing here is
 * memoized, since a package's own schema is read a handful of times per `scribe forge` run, never
 * on a path where recomputing costs anything worth guarding against — and memoizing would need its
 * own invalidation the moment a test calls `forgetSchemas()` between cases.
 */
function everyNode(): UnmodifiableList<PlacedNode> {
  const nodes: PlacedNode[] = [];

  for (const registered of declaredSchemas()) {
    const instance = new registered.source();

    for (const { moment, member } of declaredSchemaMembers(instance)) {
      if (member instanceof EnumBuilder || member instanceof DropDeclaration) {
        nodes.push({ moment, node: member.declaration });
      } else if (Array.isArray(member)) {
        for (const node of member) nodes.push({ moment, node });
      } else {
        nodes.push({ moment, node: member as SchemaNode });
      }
    }
  }

  return nodes;
}

/**
 * Every value of `bucket` a package declared, refusing a name reused within it regardless of which
 * moment either declaration belongs to, and answering only what was declared for `moment`.
 *
 * @remarks
 * The refusal runs over every moment at once, on every call: a table, say, is a single object a
 * package cannot create twice under two different moments, the same reason `MomentRegistry` used
 * to key a declaration by its name alone before this collection step existed. `keyOf` names what a
 * bucket refuses a duplicate under — a plain field for every bucket but `drop`, whose own key also
 * folds in the table a retired policy sat on.
 */
function collect<T>(bucket: SchemaNode["bucket"], moment: DbMoment, keyOf: (value: T) => string): UnmodifiableList<T> {
  const registry = new Registry<T>(bucket);
  const forMoment: T[] = [];

  for (const placed of everyNode()) {
    if (placed.node.bucket !== bucket) continue;
    const value = placed.node.value as T;
    registry.declare(keyOf(value), value);
    if (placed.moment === moment) forMoment.push(value);
  }

  return forMoment;
}

/**
 * Every table this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two tables across the whole package share a name,
 * regardless of which moment either belongs to.
 */
export function declaredTables(moment: DbMoment): UnmodifiableList<DeclaredTable> {
  return collect<DeclaredTable>("table", moment, (table) => table.name);
}

/**
 * Every index this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two indexes across the whole package share a name,
 * whether they cover the same table or two different ones.
 */
export function declaredIndexes(moment: DbMoment): UnmodifiableList<DeclaredIndex> {
  return collect<DeclaredIndex>("index", moment, (index) => index.name);
}

/**
 * Every policy this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two policies across the whole package share a name,
 * whether they guard the same table or two different ones.
 */
export function declaredPolicies(moment: DbMoment): UnmodifiableList<DeclaredPolicy> {
  return collect<DeclaredPolicy>("policy", moment, (policy) => policy.name);
}

/**
 * Every sequence this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two sequences across the whole package share a name.
 */
export function declaredSequences(moment: DbMoment): UnmodifiableList<DeclaredSequence> {
  return collect<DeclaredSequence>("sequence", moment, (sequence) => sequence.name);
}

/**
 * Every enum this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two enums across the whole package share a name.
 */
export function declaredEnums(moment: DbMoment): UnmodifiableList<DeclaredEnum> {
  return collect<DeclaredEnum>("enum", moment, (enumType) => enumType.name);
}

/**
 * Every composite type this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two composite types across the whole package share a
 * name.
 */
export function declaredTypes(moment: DbMoment): UnmodifiableList<DeclaredType> {
  return collect<DeclaredType>("type", moment, (type) => type.name);
}

/**
 * Every extension this package has declared for `moment`, in the order it declared them.
 *
 * @throws {DuplicateDeclarationError} When two extensions across the whole package share a name.
 */
export function declaredExtensions(moment: DbMoment): UnmodifiableList<DeclaredExtension> {
  return collect<DeclaredExtension>("extension", moment, (extension) => extension.name);
}

/**
 * Every retirement this package has declared for `moment`, in the order it declared them.
 *
 * @remarks
 * Keyed by the kind and the name it took together, a policy's own also folding in the table it sat
 * on — the same key `DropDeclaration` used to carry itself, before this collection step existed.
 *
 * @throws {DuplicateDeclarationError} When two retirements across the whole package name the same
 * object of the same kind — the same table twice, or the same policy on the same table twice.
 */
export function declaredDrops(moment: DbMoment): UnmodifiableList<DeclaredDrop> {
  return collect<DeclaredDrop>(
    "drop",
    moment,
    (drop) => drop.kind === "policy" ? `policy:${drop.table}.${drop.name}` : `${drop.kind}:${drop.name}`,
  );
}

/**
 * Every grant this package has declared for `moment`, in the order it declared them.
 *
 * @remarks
 * Unlike the eight buckets above, this refuses no duplicate: two grants never collide on a name,
 * the same reason `access/grant.ts`'s own `Grant` never ran through a `Registry` either.
 */
export function declaredGrants(moment: DbMoment): UnmodifiableList<DeclaredGrant> {
  return everyNode()
    .filter((placed) => placed.node.bucket === "grant" && placed.moment === moment)
    .map((placed) => (placed.node as { readonly value: DeclaredGrant }).value);
}
