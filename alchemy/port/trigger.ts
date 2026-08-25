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

import { Slot } from "../bind/slot.ts";
import { Registry } from "../declare/registry.ts";
import type { UnmodifiableList } from "../value/list.ts";
import type { FutureOr } from "../async/future.ts";
import type { DateTime } from "../value/date_time.ts";
import type { QueueOptions } from "./queue.ts";

/** The three things that can happen to a row, and there is no fourth. */
export type TriggerOp = "insert" | "update" | "delete";

/** What every change carries, whichever of the three it is. */
export interface ChangeBase {
  /** The table the row belongs to. */
  readonly table: string;

  /** What identifies the row, as text, whatever the column holding it is declared as. */
  readonly key: string;

  /** When the change was committed, as the database recorded it and not as this was told. */
  readonly at: DateTime;
}

/** A row that was written for the first time. */
export interface InsertChange<TRow> extends ChangeBase {
  /** Which of the three this is, and what narrows a body written against {@link Change}. */
  readonly op: "insert";

  /** The row as it was written. */
  readonly after: TRow;
}

/** A row that was written over. */
export interface UpdateChange<TRow> extends ChangeBase {
  /** Which of the three this is. */
  readonly op: "update";

  /** The row before the write. */
  readonly before: TRow;

  /** The row after the write. */
  readonly after: TRow;
}

/** A row that went. */
export interface DeleteChange<TRow> extends ChangeBase {
  /** Which of the three this is. */
  readonly op: "delete";

  /** The row as it stood just before it went. */
  readonly before: TRow;
}

/**
 * One column that moved, rather than the row that carries it.
 *
 * @remarks
 * It is what makes watching a column worth doing over watching the row: a body reads
 * `change.after` and not `change.after.status`. The whole row is still under {@link row} for
 * everything the column does not carry.
 */
export interface FieldChange<TRow, F extends keyof TRow> extends ChangeBase {
  /** Which of the three this is. A column only moves on a write. */
  readonly op: "update";

  /** The column that moved. */
  readonly field: F;

  /** Its value before the write. */
  readonly before: TRow[F];

  /** Its value after the write. */
  readonly after: TRow[F];

  /** The whole row as it stands after the write. */
  readonly row: TRow;
}

/**
 * Whichever of the three happened.
 *
 * Testing `change.op` narrows it, so a body written against this reads `before` and `after` where
 * they exist and nowhere else.
 */
export type Change<TRow> = InsertChange<TRow> | UpdateChange<TRow> | DeleteChange<TRow>;

/** A body handed a change, whatever shape it takes. */
export type ChangeHandler<C> = (change: C) => FutureOr<void>;

/**
 * The move a column has to make for a body to be called, both ends optional.
 *
 * @remarks
 * Leaving one out means any value on that side, so `{ to: "paid" }` is every write that lands on
 * paid whatever it came from, and `{ from: "held" }` is every write that leaves held.
 */
export interface Transition<V> {
  /** What the column has to be leaving. Any value when left out. */
  readonly from?: V;

  /** What the column has to be landing on. Any value when left out. */
  readonly to?: V;
}

/** What declaring a watch takes beyond the table it watches. */
export interface TriggerOptions {
  /**
   * What this watch is registered under.
   *
   * The table and the operation decide it when left out, which is enough until two watches on the
   * same table and the same operation collide.
   */
  readonly name?: string;

  /** The column holding what identifies one row. `id` when left out. */
  readonly key?: string;

  /**
   * What the queue behind this watch is tuned with.
   *
   * There is one, and it is why a body that fails is tried again rather than lost: a change is
   * handed over the same way any other deferred work is.
   */
  readonly queue?: QueueOptions;
}

/**
 * What reacts to a row being written, written over, or removed.
 *
 * @remarks
 * A package declares what it watches and what to do about it. What notices the change, what carries
 * it, and what installs whatever the database needs are all the host's business.
 *
 * **A body is called after the write has been committed**, never during it. So it cannot refuse the
 * write, and the row it is handed may already have moved again by the time it runs. A rule that
 * has to hold belongs in a constraint of the schema, not here.
 */
export interface Trigger<TRow> {
  /** Calls `handle` for every row written to this table for the first time. */
  onInsert(handle: ChangeHandler<InsertChange<TRow>>): Trigger<TRow>;

  /** Calls `handle` for every write over a row of this table. */
  onUpdate(handle: ChangeHandler<UpdateChange<TRow>>): Trigger<TRow>;

  /** Calls `handle` for every row of this table that goes. */
  onDelete(handle: ChangeHandler<DeleteChange<TRow>>): Trigger<TRow>;

  /**
   * Calls `handle` for every write that moves `field`.
   *
   * @param moving - Which move counts. Every move of the column when left out.
   */
  onField<F extends keyof TRow>(
    field: F,
    handle: ChangeHandler<FieldChange<TRow, F>>,
    moving?: Transition<TRow[F]>,
  ): Trigger<TRow>;
}

/** What watches a table and hands over what happened to it. */
export interface TriggerDriver {
  /** Opens a watch on `table`, described by `options`. */
  watch<TRow>(table: string, options?: TriggerOptions): Trigger<TRow>;
}

/**
 * What answers a package that needs to react to a row changing.
 *
 * The host fills it once, at boot, and a test fills it with something that hands a change over by
 * hand rather than waiting for a database to notice one.
 */
export const Triggers: Slot<TriggerDriver> = new Slot<TriggerDriver>("Triggers");

/** One watch as it was declared, kept until the host has something to install it on. */
interface DeclaredWatch {
  /** The table it watches. */
  readonly table: string;

  /** What it was declared with. */
  readonly options: TriggerOptions | undefined;

  /** Every call written on the chain, in the order it was written. */
  readonly written: Array<(on: Trigger<never>) => void>;
}

/** Every watch a package has declared, by the name it answers to. */
const declared = new Registry<DeclaredWatch>("trigger");

/**
 * A watch that records what is written on it and reaches nothing.
 *
 * @remarks
 * The chain answers itself, so a package writes the same thing it always wrote. What each call
 * receives is kept and played back onto the driver's own watch by {@link installTriggers}, in the
 * order it was written.
 */
class DeclaredTrigger<TRow> implements Trigger<TRow> {
  /** Where each call written on this chain is kept. */
  readonly #written: Array<(on: Trigger<never>) => void>;

  constructor(written: Array<(on: Trigger<never>) => void>) {
    this.#written = written;
  }

  onInsert(handle: ChangeHandler<InsertChange<TRow>>): Trigger<TRow> {
    this.#written.push((on) => (on as Trigger<TRow>).onInsert(handle));
    return this;
  }

  onUpdate(handle: ChangeHandler<UpdateChange<TRow>>): Trigger<TRow> {
    this.#written.push((on) => (on as Trigger<TRow>).onUpdate(handle));
    return this;
  }

  onDelete(handle: ChangeHandler<DeleteChange<TRow>>): Trigger<TRow> {
    this.#written.push((on) => (on as Trigger<TRow>).onDelete(handle));
    return this;
  }

  onField<F extends keyof TRow>(
    field: F,
    handle: ChangeHandler<FieldChange<TRow, F>>,
    moving?: Transition<TRow[F]>,
  ): Trigger<TRow> {
    this.#written.push((on) => (on as Trigger<TRow>).onField(field, handle, moving));
    return this;
  }
}

/**
 * Declares a watch on `table`, without reaching anything.
 *
 * @remarks
 * It records the watch and answers a chain that records what is written on it. Nothing is installed
 * until the host calls {@link installTriggers}, which is the shape every other port takes: a package
 * writes its declarations at module scope, before the host is up, and importing one is safe.
 *
 * Reading the slot here instead would throw in every package that declares a watch, because a
 * package entry is imported so the host can read its lifecycle and that import necessarily comes
 * before the host has filled anything.
 *
 * @throws {DuplicateDeclarationError} When the name this watch answers to has already been taken,
 * raised where the second declaration is written.
 *
 * @example
 * ```ts
 * trigger<OrderRow>("orders")
 *   .onInsert((change) => confirm(change.after))
 *   .onField("status", (change) => refund(change.row), { to: "cancelled" });
 * ```
 */
export function trigger<TRow>(table: string, options?: TriggerOptions): Trigger<TRow> {
  const written: Array<(on: Trigger<never>) => void> = [];
  declared.declare(options?.name ?? table, { table, options, written });
  return new DeclaredTrigger<TRow>(written);
}

/**
 * Opens every declared watch on the driver, and answers what it opened.
 *
 * @remarks
 * The host calls it once, after it has filled {@link Triggers} and before it starts serving.
 */
export function installTriggers(): UnmodifiableList<Trigger<never>> {
  const driver = Triggers.get();
  return declared.all().map((watch) => {
    const opened = driver.watch<never>(watch.table, watch.options);
    for (const write of watch.written) write(opened);
    return opened;
  });
}

/** Forgets every declared watch, which is what a test does between cases. */
export function forgetTriggers(): void {
  declared.forget();
}
