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

import type { UnmodifiableList } from "../../../../primitives/value/list.ts";
import { MomentRegistry } from "../moment.ts";
import type { DbMoment, SchemaAddable } from "../moment.ts";

/** The kind of object a `Drop` targets, one member per method {@link DropTarget} exposes. */
type DropObjectKind = "table" | "index" | "type" | "policy" | "extension";

/** A retirement exactly as `Drop` declared it, one member per kind of object. */
export type DeclaredDrop =
  | { readonly kind: "table"; readonly name: string; readonly cascade: boolean }
  | { readonly kind: "index"; readonly name: string; readonly cascade: boolean }
  | { readonly kind: "type"; readonly name: string; readonly cascade: boolean }
  | { readonly kind: "policy"; readonly name: string; readonly table: string; readonly cascade: boolean }
  | { readonly kind: "extension"; readonly name: string; readonly cascade: boolean };

/** Every retirement this package has declared, by the kind and the name it took together. */
const declared = new MomentRegistry<DeclaredDrop>("drop");

/**
 * A retirement under construction, still open to {@link cascade}, declared once handed to one of
 * `Schema`'s own `.init`, `.migrations` or `.provisioning` batches — most often `.migrations`,
 * since a retirement almost always answers for an object a previous version of the package left
 * behind.
 *
 * @remarks
 * Unlike `Table` or `Type`, nothing here closes the chain with a call of its own: `Schema`'s own
 * `.with` reads whatever `.cascade`, or {@link DropTarget} itself, last answered directly, so this
 * implements {@link SchemaAddable} itself, rather than answering a `SchemaEntry` the way a closing
 * call would.
 *
 * Nothing here carries an `ifExists` of its own: what the render emits for every declaration in
 * `schema/`, a retirement included, already guards itself — `create` protected against an object
 * already there, `drop` against one already gone — so there is no case where an author would ever
 * want the unprotected form, and no flag left to spell for it.
 */
export class DropDeclaration implements SchemaAddable<DeclaredDrop> {
  readonly #key: string;
  readonly #record: { kind: DropObjectKind; name: string; table?: string; cascade: boolean };

  /** Opened by one of {@link DropTarget}'s own methods, never directly. */
  constructor(kind: DropObjectKind, name: string, table?: string) {
    this.#record = { kind, name, table, cascade: false };
    this.#key = kind === "policy" ? `policy:${table}.${name}` : `${kind}:${name}`;
  }

  /** Drops whatever depends on this object too, rather than refusing while a dependent exists. */
  cascade(): this {
    this.#record.cascade = true;
    return this;
  }

  /**
   * Registers this retirement for `moment`, called by `Schema`'s own `.with`, never directly.
   *
   * @throws {DuplicateDeclarationError} When this object has already been declared as one to drop.
   */
  declareInto(moment: DbMoment): DeclaredDrop {
    return declared.declare(this.#key, moment, this.#record as DeclaredDrop);
  }
}

/**
 * The object `Drop`'s `name` names, still undecided — exposes only the five kinds `Drop` can
 * retire, and nothing else, so a modifier like `.cascade` never appears before the kind that
 * decides whether it is even reachable.
 */
export class DropTarget {
  readonly #name: string;

  /** Opened by `Drop`, never directly. */
  constructor(name: string) {
    this.#name = name;
  }

  /**
   * Names `name` as a table to retire from a previous version of this package's schema.
   *
   * @remarks
   * Fine-grained evolution of a table already in use — adding a column, dropping one, changing a
   * type, adding or dropping a single constraint — has no typed form here on purpose: Postgres has
   * no universal `if not exists`/`if exists` for every `alter table` sub-operation the way it does
   * for a whole object, `rename` chief among them, so a statement built from one would not be safe
   * to replay unconditionally the way every other declaration in `schema/` already is. That belongs
   * in a raw `Sql(...)` a package guards itself, most often `alter table ... drop constraint if
   * exists x, add constraint x ...`, the idiom that makes a constraint change replayable.
   *
   * @throws {DuplicateDeclarationError} When this table has already been declared as one to drop,
   * raised where `declareInto` runs.
   */
  table(): DropDeclaration {
    return new DropDeclaration("table", this.#name);
  }

  /**
   * Names `name` as an index to retire from a previous version of this package's schema.
   *
   * @throws {DuplicateDeclarationError} When this index has already been declared as one to drop,
   * raised where `declareInto` runs.
   */
  index(): DropDeclaration {
    return new DropDeclaration("index", this.#name);
  }

  /**
   * Names `name` as an enum or a composite type to retire from a previous version of this
   * package's schema.
   *
   * @throws {DuplicateDeclarationError} When this type has already been declared as one to drop,
   * raised where `declareInto` runs.
   */
  type(): DropDeclaration {
    return new DropDeclaration("type", this.#name);
  }

  /**
   * Names `name` as a policy carried by `table` to retire from a previous version of this
   * package's schema.
   *
   * @throws {DuplicateDeclarationError} When this policy has already been declared as one to drop
   * on the same table, raised where `declareInto` runs.
   */
  policy(table: string): DropDeclaration {
    return new DropDeclaration("policy", this.#name, table);
  }

  /**
   * Names `name` as an extension to retire from a previous version of this package's schema.
   *
   * @throws {DuplicateDeclarationError} When this extension has already been declared as one to
   * drop, raised where `declareInto` runs.
   */
  extension(): DropDeclaration {
    return new DropDeclaration("extension", this.#name);
  }
}

/**
 * Opens the retirement of an object named `name` from a previous version of this package's
 * schema — never for undoing a table, index or other object this same render also declares, which
 * is simply an object nobody should have written down to begin with.
 *
 * @remarks
 * `Drop` never exposes `.cascade` itself: {@link DropTarget}, what it rends, only carries the five
 * kinds a retirement can name. Naming one, `.table()` chief among them, is what closes the chain —
 * there is no separate call the way `Table` waits on `.columns`, since every kind takes the same
 * one modifier and nothing is left for a closing call to decide. `Drop` no longer takes a moment of
 * its own either: what it builds declares nothing by itself, and only renders once handed to one
 * of `Schema`'s own batches, most often `.migrations`, since a retirement almost always answers for
 * an object a previous version of the package left behind.
 *
 * @example
 * ```ts ignore
 * dbSchema.migrations().with((w) => [
 *   w.drop("__legacy_sessions__").table().cascade(),
 *   w.drop("__legacy_sessions___token_idx__").index(),
 *   w.drop("__bookings__self_read__").policy("__bookings__"),
 *   w.drop("hstore").extension(),
 * ]);
 * ```
 */
export function Drop(name: string): DropTarget {
  return new DropTarget(name);
}

/** Every retirement this package has declared for `moment`, in the order it declared them. */
export function declaredDrops(moment: DbMoment): UnmodifiableList<DeclaredDrop> {
  return declared.at(moment);
}

/** Forgets every declared retirement, which is what a test does between cases. */
export function forgetDrops(): void {
  declared.forget();
}
