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

import type { Future } from "../../async/future.ts";
import type {
  ChangeHandler,
  DeleteChange,
  FieldChange,
  InsertChange,
  Transition,
  Trigger,
  TriggerDriver,
  TriggerOptions,
} from "../../port/trigger.ts";
import type { UpdateChange } from "../../port/trigger.ts";

/**
 * A watch that keeps what was written on it and notices nothing, for a test to run a package
 * against.
 *
 * @remarks
 * A case hands a change over through one of the `saw` members rather than writing a row and waiting
 * for a database to notice, which is what lets a package's reaction be exercised without a database
 * at all.
 */
export class MemoryTrigger<TRow> implements Trigger<TRow> {
  readonly #inserts: Array<ChangeHandler<InsertChange<TRow>>> = [];
  readonly #updates: Array<ChangeHandler<UpdateChange<TRow>>> = [];
  readonly #deletes: Array<ChangeHandler<DeleteChange<TRow>>> = [];
  readonly #fields = new Map<keyof TRow, Array<ChangeHandler<FieldChange<TRow, keyof TRow>>>>();

  onInsert(handle: ChangeHandler<InsertChange<TRow>>): Trigger<TRow> {
    this.#inserts.push(handle);
    return this;
  }

  onUpdate(handle: ChangeHandler<UpdateChange<TRow>>): Trigger<TRow> {
    this.#updates.push(handle);
    return this;
  }

  onDelete(handle: ChangeHandler<DeleteChange<TRow>>): Trigger<TRow> {
    this.#deletes.push(handle);
    return this;
  }

  onField<F extends keyof TRow>(
    field: F,
    handle: ChangeHandler<FieldChange<TRow, F>>,
    _moving?: Transition<TRow[F]>,
  ): Trigger<TRow> {
    const held = this.#fields.get(field) ?? [];
    held.push(handle as ChangeHandler<FieldChange<TRow, keyof TRow>>);
    this.#fields.set(field, held);
    return this;
  }

  /** Hands `change` to whoever asked about a row being written for the first time. */
  async sawInsert(change: InsertChange<TRow>): Future<void> {
    for (const handle of this.#inserts) await handle(change);
  }

  /** Hands `change` to whoever asked about a row being written over. */
  async sawUpdate(change: UpdateChange<TRow>): Future<void> {
    for (const handle of this.#updates) await handle(change);
  }

  /** Hands `change` to whoever asked about a row going. */
  async sawDelete(change: DeleteChange<TRow>): Future<void> {
    for (const handle of this.#deletes) await handle(change);
  }

  /** Hands `change` to whoever asked about `field` moving. */
  async sawField<F extends keyof TRow>(field: F, change: FieldChange<TRow, F>): Future<void> {
    for (const handle of this.#fields.get(field) ?? []) {
      await handle(change as FieldChange<TRow, keyof TRow>);
    }
  }
}

/** A driver that opens a {@link MemoryTrigger} per table, for a test to fill `Triggers` with. */
export class MemoryTriggers implements TriggerDriver {
  /** Every watch opened so far, by the name it answers to. */
  readonly opened: Map<string, MemoryTrigger<never>> = new Map<string, MemoryTrigger<never>>();

  watch<TRow>(table: string, options?: TriggerOptions): Trigger<TRow> {
    const name = options?.name ?? table;
    const already = this.opened.get(name);
    if (already !== undefined) return already as unknown as Trigger<TRow>;

    const held = new MemoryTrigger<TRow>();
    this.opened.set(name, held as unknown as MemoryTrigger<never>);
    return held;
  }
}
