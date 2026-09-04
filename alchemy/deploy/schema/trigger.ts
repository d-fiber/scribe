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

import { Registry } from "../../declare/registry.ts";
import type { UnmodifiableList } from "../../value/list.ts";

/** When a trigger fires relative to the row event it watches. */
export type SqlTriggerTiming = "before" | "after" | "instead of";

/** A row event a trigger can watch, one or several at once. */
export type SqlTriggerEvent = "insert" | "update" | "delete" | "truncate";

/** What `SqlTrigger` takes: the table and the events it watches, and the function it fires. */
export interface SqlTriggerOptions {
  /** The table this trigger watches. */
  readonly table: string;

  /** When it fires relative to the events it watches. */
  readonly timing: SqlTriggerTiming;

  /** The events that fire it, at least one. */
  readonly events: UnmodifiableList<SqlTriggerEvent>;

  /** The name of the `SqlFunction` this trigger executes. */
  readonly function: string;

  /** Whether it fires once per matched row or once for the whole statement. `row` when left out. */
  readonly forEach?: "row" | "statement";
}

/** A trigger exactly as `SqlTrigger` declared it. */
export interface DeclaredSqlTrigger {
  /** The name this trigger is created under. */
  readonly name: string;

  /** What it watches, when it fires, and what it executes. */
  readonly options: SqlTriggerOptions;
}

/** Every trigger this package has declared, by the name it took. */
const declared = new Registry<DeclaredSqlTrigger>("trigger");

/**
 * Declares a Postgres trigger named `name`, described by `options`, without reaching anything.
 *
 * @remarks
 * This is the SQL-side counterpart to `trigger`, in `port/`, which answers a process reacting to a
 * row `foundation`'s own change log already recorded. This one runs **inside** Postgres, on the
 * table itself, and can do anything its `SqlFunction` does — including writing to
 * `foundation`'s change log by hand, the way that package's own trigger does for the tables it
 * watches directly.
 *
 * Nothing here checks that `options.table` or `options.function` names something this package
 * declared: both are built before the rest of the package's schema is known to exist. Whatever
 * renders the SQL orders a trigger after the table it watches and the function it executes, and
 * Postgres itself refuses a trigger naming either that does not exist.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * SqlTrigger("__widgets_touch_trigger__", {
 *   table: "__widgets__",
 *   timing: "before",
 *   events: ["update"],
 *   function: "__widgets_touch__",
 * });
 * ```
 */
export function SqlTrigger(
  name: string,
  options: SqlTriggerOptions,
): DeclaredSqlTrigger {
  return declared.declare(name, { name, options });
}

/** Every trigger this package has declared, in the order it declared them. */
export function declaredSqlTriggers(): UnmodifiableList<DeclaredSqlTrigger> {
  return declared.all();
}

/** Forgets every declared trigger, which is what a test does between cases. */
export function forgetSqlTriggers(): void {
  declared.forget();
}
