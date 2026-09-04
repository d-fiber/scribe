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

/** What `SqlCronJob` takes: when it runs, and the SQL it runs. */
export interface SqlCronJobOptions {
  /** A `pg_cron` schedule, five fields, as `foundation`'s own `pg_cron` extension reads it. */
  readonly schedule: string;

  /**
   * The SQL command `pg_cron` runs on `schedule`, raw.
   *
   * @remarks
   * Nothing here validates it, the same reason a column's `defaultValue` and a function's `body`
   * are raw too. It fully qualifies its own tables, `<package>.<table>`, because a scheduled job
   * runs with the database's own search path, not this package's.
   */
  readonly command: string;
}

/** A scheduled job exactly as `SqlCronJob` declared it. */
export interface DeclaredSqlCronJob {
  /** The name `pg_cron` schedules this job under. */
  readonly name: string;

  /** When it runs, and what it runs. */
  readonly options: SqlCronJobOptions;
}

/** Every scheduled job this package has declared, by the name it took. */
const declared = new Registry<DeclaredSqlCronJob>("cron job");

/**
 * Declares a `pg_cron` job named `name`, described by `options`, without reaching anything.
 *
 * @remarks
 * This is the SQL-side counterpart to `cron`, in `port/`, which schedules a TypeScript function a
 * running process fires. This one is scheduled **inside** Postgres itself, by the `pg_cron`
 * extension `foundation` opens, and it runs `options.command` on the database directly — it is
 * why the two are named apart, `SqlCronJob` here and `cron` there, rather than a `cron`/`cron`
 * pair that reads the same in two unrelated places doing two different things.
 *
 * @throws {DuplicateDeclarationError} When `name` has already been declared, raised where the
 * second declaration is written.
 *
 * @example
 * ```ts ignore
 * SqlCronJob("widget-parts-sweep", {
 *   schedule: "*\/10 * * * *",
 *   command: "delete from __widgets__.__widget_parts__ where label = ''",
 * });
 * ```
 */
export function SqlCronJob(
  name: string,
  options: SqlCronJobOptions,
): DeclaredSqlCronJob {
  return declared.declare(name, { name, options });
}

/** Every scheduled job this package has declared, in the order it declared them. */
export function declaredSqlCronJobs(): UnmodifiableList<DeclaredSqlCronJob> {
  return declared.all();
}

/** Forgets every declared scheduled job, which is what a test does between cases. */
export function forgetSqlCronJobs(): void {
  declared.forget();
}
