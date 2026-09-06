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

import type { UnmodifiableList } from "../../value/list.ts";
import { Grant, GrantBuilder } from "./access/grant.ts";
import { Drop, DropTarget } from "./lifecycle/drop.ts";
import type { DbMoment, SchemaAddable } from "./moment.ts";
import type { ExtensionName } from "./objects/extension.ts";
import { Extension, ExtensionBuilder } from "./objects/extension.ts";
import { Sequence, SequenceBuilder } from "./objects/sequence.ts";
import { Table, TableBuilder } from "./table/table.ts";
import { Enum, EnumBuilder } from "./types/enum.ts";
import { Type, TypeBuilder } from "./types/type.ts";

/**
 * Opens every kind a `Schema` batch can carry, passed to {@link SchemaBatch.with}'s own callback.
 *
 * @remarks
 * Each method here is exactly its own top-level function — `w.table` and `Table` are the same
 * call, `w.enum` and `Enum` the same, and so on for the rest. This exists so that autocompletion on
 * `w.` lists precisely the seven things a batch can hold, without a package author needing to
 * import seven separate names from `@scribe/alchemy` to write one file.
 */
export class SchemaContentFactory {
  /** Opens a Postgres table named `name`. Same call as the top-level `Table`. */
  table(name: string): TableBuilder {
    return Table(name);
  }

  /** Opens a Postgres sequence named `name`. Same call as the top-level `Sequence`. */
  sequence(name: string): SequenceBuilder {
    return Sequence(name);
  }

  /** Opens a Postgres enum type named `name`. Same call as the top-level `Enum`. */
  enum(name: string): EnumBuilder {
    return Enum(name);
  }

  /** Opens a Postgres composite type named `name`. Same call as the top-level `Type`. */
  type(name: string): TypeBuilder {
    return Type(name);
  }

  /** Opens a Postgres extension named `name`. Same call as the top-level `Extension`. */
  extension(name: ExtensionName): ExtensionBuilder {
    return Extension(name);
  }

  /** Opens a Postgres privilege grant. Same call as the top-level `Grant`. */
  grant(): GrantBuilder {
    return Grant();
  }

  /** Opens the retirement of an object named `name`. Same call as the top-level `Drop`. */
  drop(name: string): DropTarget {
    return Drop(name);
  }
}

/**
 * One of a package's three `db` moments, opened by one of {@link Schema}'s own methods, closed by
 * {@link with}.
 *
 * @remarks
 * `init` is played once against the package's own schema; `migrations` is applied once each
 * through `dbmate` as the package evolves; `provisioning` is played before the package's own schema
 * exists.
 */
export class SchemaBatch {
  readonly #moment: DbMoment;

  /** Opened by one of {@link Schema}'s own methods, never directly. */
  constructor(moment: DbMoment) {
    this.#moment = moment;
  }

  /**
   * Declares everything `build` answers, in the order it lists them, for this batch's own moment.
   *
   * @remarks
   * A `Table`, a `Sequence`, an `Enum`, a `Type`, an `Extension`, a `Grant` or a `Drop` no longer
   * says its own moment: none of the seven registers anything by itself any more, so a value one of
   * them built but never listed here is a declaration nobody ever sees, the same as any other value
   * nothing reads. `w`, the callback's own argument, is a shortcut to the same seven top-level
   * functions, so nothing under `schema/` needs importing by name to write one batch.
   */
  with(
    build: (
      w: SchemaContentFactory,
    ) => UnmodifiableList<SchemaAddable<unknown>>,
  ): void {
    for (const entry of build(new SchemaContentFactory())) {
      entry.declareInto(this.#moment);
    }
  }
}

/**
 * The single entry point for everything a package's `schema/` declares, one call per moment.
 *
 * @remarks
 * Before this existed, a `Table` or a `Sequence` chose its own moment with `.init()`, `.migrations()`
 * or `.provisioning()`, while an `Enum`, a `Type`, a `Grant`, an `Extension` and a `Drop` each
 * rendered into one moment fixed in the code that read them back — an enum or a composite type
 * always under `init`, an extension always under `provisioning`, a retirement always under
 * `migrations`. `Schema` replaces every one of those seven separate answers with a single one: the
 * batch a declaration was finally listed under is the only place its moment lives now, for all
 * seven kinds alike.
 *
 * @example
 * ```ts ignore
 * dbSchema.init().with((w) => [
 *   w.enum("booking_status").value("pending").value("confirmed"),
 *   w.table("__accounts__").columns((c) => ({ id: c.uuid().isPrimary() })),
 * ]);
 *
 * dbSchema.migrations().with((w) => [
 *   w.table("__account_devices__")
 *     .primaryKey((pk) => pk.columns(["account_id", "device_id"]))
 *     .columns((c) => ({ accountId: c.uuid(), deviceId: c.uuid() })),
 *   w.drop("__legacy_sessions__").table(),
 * ]);
 *
 * dbSchema.provisioning().with((w) => [w.extension("pg_trgm").install()]);
 * ```
 */
export class Schema {
  /** Opens the batch rendered once, against the package's own schema. */
  init(): SchemaBatch {
    return new SchemaBatch("init");
  }

  /** Opens the batch applied once, through `dbmate`, as the package evolves. */
  migrations(): SchemaBatch {
    return new SchemaBatch("migrations");
  }

  /** Opens the batch played once, before the package's own schema exists. */
  provisioning(): SchemaBatch {
    return new SchemaBatch("provisioning");
  }
}

/**
 * The one `Schema` a package's `schema/` writes against — every file of it shares this same
 * instance.
 *
 * @remarks
 * Named `dbSchema`, not `schema`: `port/database.ts` already exports a `schema<S>()` of its own,
 * the call a package's application code makes to reach a typed database client, an entirely
 * different thing this would otherwise collide with.
 */
export const dbSchema: Schema = new Schema();
