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

import { Registry } from "../../../wiring/declare/registry.ts";
import type { UnmodifiableList } from "../../../primitives/value/list.ts";

/**
 * Which of a package's three `db` moments a declaration belongs to — `init`, played once against
 * the package's own schema; `migrations`, applied once each as the package evolves, through
 * `dbmate`; or `provisioning`, played before the package's own schema exists.
 *
 * @remarks
 * Defined here, underneath everything else `schema/` holds, so that a kind's own file —
 * `table/table.ts`, `access/grant.ts`, `types/enum.ts` and the rest — never has to import back
 * from `schema.ts`, which composes all of them into `Schema`, just to share this one vocabulary.
 */
export type DbMoment = "init" | "migrations" | "provisioning";

/**
 * A declaration that has everything it needs but the moment it renders under, answered once
 * `Schema` gives it one.
 *
 * @remarks
 * Every kind under `schema/` — `Table`, `Sequence`, `Enum`, `Type`, `Extension`, `Grant` and `Drop`
 * — satisfies this once its own chain reaches the point that used to register it outright: none of
 * them still knows its own moment, `schema.md`'s own `## Schema` section gives the reason.
 * `declareInto` is called by `Schema` alone, once, and never by the package that wrote the
 * declaration.
 */
export interface SchemaAddable<T> {
  /** Registers this declaration for `moment`, and answers the value it declares. */
  declareInto(moment: DbMoment): T;
}

/**
 * The shared shape behind a terminal call that used to register its declaration outright and now
 * waits on `Schema` instead — `Table`'s own `.columns`, `Type`'s own `.fields`, `Sequence`'s own
 * `.create`, `Extension`'s own `.install` and `Grant`'s own `.to` each answer one of these.
 *
 * @remarks
 * `Enum` and `Drop` have no terminal call built the same way — a value still under construction,
 * itself, is what a `Schema` batch carries for them — so `EnumBuilder` and `DropDeclaration`
 * implement {@link SchemaAddable} directly, rather than answering one of these.
 */
export class SchemaEntry<T> implements SchemaAddable<T> {
  readonly #finish: (moment: DbMoment) => T;

  /** Wraps `finish`, called once with the moment `Schema` chose. */
  constructor(finish: (moment: DbMoment) => T) {
    this.#finish = finish;
  }

  /** Runs the deferred registration this entry wraps, for `moment`, and answers what it declares. */
  declareInto(moment: DbMoment): T {
    return this.#finish(moment);
  }
}

/**
 * Everything of one kind a package declared across its three `db` moments, filed by name and read
 * back one moment at a time.
 *
 * @remarks
 * `Table`, `Enum`, `Extension`, `Sequence` and `Type` each keep one of these, and `Table` keeps
 * three, one for its tables, one for its indexes and one for its policies: none of them carries its
 * own moment any more, `## Schema` in `schema.md` gives the reason, so each needs the same pairing
 * of a name-keyed {@link Registry} with the moment its declaration was filed under. `Grant` is the
 * one exception, and stays outside this class rather than being forced into it: two grants never
 * collide on a name, so it keeps a plain array instead of a `Registry` — `access/grant.ts`'s own
 * remarks give the reason.
 */
export class MomentRegistry<T> {
  readonly #held: Registry<{ moment: DbMoment; value: T }>;

  /** Opens a registry for declarations of `kind`, the same word a bare {@link Registry} would take. */
  constructor(kind: string) {
    this.#held = new Registry(kind);
  }

  /**
   * Records that `name` was declared for `moment`, and answers what was declared under it.
   *
   * @throws {DuplicateDeclarationError} When `name` was already taken, regardless of which moment
   * it was taken for.
   */
  declare(name: string, moment: DbMoment, value: T): T {
    return this.#held.declare(name, { moment, value }).value;
  }

  /** Everything declared for `moment`, in the order it was declared. */
  at(moment: DbMoment): UnmodifiableList<T> {
    return this.#held.all().filter((entry) => entry.moment === moment).map((entry) => entry.value);
  }

  /** Forgets everything declared, which is what a test does between cases. */
  forget(): void {
    this.#held.forget();
  }
}
