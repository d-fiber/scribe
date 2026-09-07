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
import type { DeclaredGrant } from "./access/grant.ts";
import type { DeclaredDrop, DropDeclaration } from "./lifecycle/drop.ts";
import type { DeclaredExtension } from "./objects/extension.ts";
import type { DeclaredSequence } from "./objects/sequence.ts";
import type { DeclaredIndex, DeclaredPolicy, DeclaredTable } from "./table/table.ts";
import type { DeclaredEnum, EnumBuilder } from "./types/enum.ts";
import type { DeclaredType } from "./types/type.ts";

/**
 * Which of a package's three `db` moments a declaration belongs to — `init`, played once against
 * the package's own schema; `migrations`, applied once each as the package evolves, through
 * `dbmate`; or `provisioning`, played before the package's own schema exists.
 *
 * @remarks
 * Defined here, underneath everything else `schema/` holds, so that a kind's own file —
 * `table/table.ts`, `access/grant.ts`, `types/enum.ts` and the rest — never has to import back
 * from `schema.ts`, which reads all of them to answer a package's own declarations.
 */
export type DbMoment = "init" | "migrations" | "provisioning";

/**
 * One declaration exactly as its own kind resolved it, tagged with which of the nine buckets
 * `schema.ts` sorts it into.
 *
 * @remarks
 * None of the nine kinds under `schema/` — `Table` itself and the index, policy and grant it
 * carries, `Sequence`, `Enum`, `Type`, `Extension`, a standalone `Grant`, `Drop` — write themselves
 * into a shared registry any more: each answers a plain node instead, and it is `schema.ts`'s own
 * collection step, run once a `@Schema()` class is read back, that sorts every node by
 * {@link bucket} and refuses a name reused within one. `bucket` is deliberately its own field
 * rather than reusing a kind's own `kind`, since {@link DeclaredDrop}'s own `kind` already names
 * what a retirement targets — `"table"`, `"policy"` — a different question from which of these nine
 * buckets the retirement itself belongs to.
 */
export type SchemaNode =
  | { readonly bucket: "table"; readonly value: DeclaredTable }
  | { readonly bucket: "index"; readonly value: DeclaredIndex }
  | { readonly bucket: "policy"; readonly value: DeclaredPolicy }
  | { readonly bucket: "grant"; readonly value: DeclaredGrant }
  | { readonly bucket: "sequence"; readonly value: DeclaredSequence }
  | { readonly bucket: "enum"; readonly value: DeclaredEnum }
  | { readonly bucket: "type"; readonly value: DeclaredType }
  | { readonly bucket: "extension"; readonly value: DeclaredExtension }
  | { readonly bucket: "drop"; readonly value: DeclaredDrop };

/** Tags `value` with `bucket`, the one way a kind's own file builds a {@link SchemaNode}. */
export function schemaNode<B extends SchemaNode["bucket"]>(
  bucket: B,
  value: Extract<SchemaNode, { bucket: B }>["value"],
): Extract<SchemaNode, { bucket: B }> {
  return { bucket, value } as Extract<SchemaNode, { bucket: B }>;
}

/**
 * What a method marked `@SchemaInit`/`@SchemaMigration`/`@SchemaProvisioning` may answer.
 *
 * @remarks
 * Most kinds close on a single {@link SchemaNode} — `Extension`'s own `.install()`, `Sequence`'s
 * own `.create()`, `Type`'s own `.fields()`, `Grant`'s own `.to()`. `Table`'s own `.columns()`
 * answers several at once: itself, and every index, policy and grant it carries, so a table's own
 * declaring method answers `UnmodifiableList<SchemaNode>` instead. `Enum` and `Drop` have no
 * closing call at all — `.value()` and `.cascade()` each keep returning `this` — so a method
 * declaring either answers the still-open {@link EnumBuilder} or {@link DropDeclaration} itself,
 * read back through its own `.declaration` getter once `schema.ts`'s own collection step is ready
 * for it, never before.
 */
export type SchemaMember = SchemaNode | UnmodifiableList<SchemaNode> | EnumBuilder | DropDeclaration;
