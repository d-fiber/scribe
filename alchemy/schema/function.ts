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

import { Registry } from "../declare/registry.ts";
import type { UnmodifiableList } from "../value/list.ts";

/** What `SqlFunction` takes: a Postgres function's signature and its raw body. */
export interface SqlFunctionOptions {
  /** The language the body is written in. `plpgsql` when left out, which is what a trigger function needs. */
  readonly language?: "sql" | "plpgsql";

  /** The Postgres type this function returns, spelled the way `create function` takes it: `trigger`, `void`, `uuid`. */
  readonly returns: string;

  /**
   * Whether this function runs as the role that calls it (`invoker`) or as the role that owns it
   * (`definer`). `invoker` when left out.
   *
   * @remarks
   * A trigger function usually needs `definer`, so it can reach a table the row's own role cannot,
   * the way `foundation`'s own change log does.
   */
  readonly security?: "invoker" | "definer";

  /**
   * Pins the schemas this function resolves an unqualified name against, regardless of who calls
   * it. Left unset when this function fully qualifies every name in its own body.
   *
   * @remarks
   * A `definer` function that does not pin this is open to a caller that manipulates its own
   * search path into naming a different table than the one this function meant.
   */
  readonly searchPath?: string;

  /**
   * The function's body, raw Postgres between `$$`.
   *
   * @remarks
   * Nothing here validates it: a function's body is arbitrary Postgres syntax no closed
   * vocabulary covers, the same reason a column's `defaultValue` is raw too.
   */
  readonly body: string;
}

/** A function exactly as `SqlFunction` declared it. */
export interface DeclaredSqlFunction {
  /** The name this function is created under. */
  readonly name: string;

  /** What it returns, how it runs, and its body. */
  readonly options: SqlFunctionOptions;
}

/** Every function this package has declared, by the name it took. */
const declared = new Registry<DeclaredSqlFunction>("function");

/**
 * Declares a Postgres function named `name`, described by `options`, without reaching anything.
 *
 * @remarks
 * This is the SQL-side counterpart to `trigger` and `cron` in `port/`, which are answered by a
 * running process reacting to a change or a schedule. A function declared here runs **inside**
 * Postgres itself, most often as what a `SqlTrigger` executes, and it is why the two families are
 * named apart: `SqlFunction`, `SqlTrigger` and `SqlCronJob` here, `trigger` and `cron` there,
 * rather than a `function`/`trigger` pair that reads the same in two unrelated places.
 *
 * `SqlTrigger` names this function by `name`, in either order: nothing here checks that a trigger
 * naming this function exists, or that this function names a trigger that exists, because a
 * function is built before the rest of the package's schema is known to exist.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * SqlFunction("__widgets_touch__", {
 *   returns: "trigger",
 *   body: "begin new.updated_at := now(); return new; end;",
 * });
 * ```
 */
export function SqlFunction(name: string, options: SqlFunctionOptions): DeclaredSqlFunction {
  return declared.declare(name, { name, options });
}

/** Every function this package has declared, in the order it declared them. */
export function declaredSqlFunctions(): UnmodifiableList<DeclaredSqlFunction> {
  return declared.all();
}

/** Forgets every declared function, which is what a test does between cases. */
export function forgetSqlFunctions(): void {
  declared.forget();
}
