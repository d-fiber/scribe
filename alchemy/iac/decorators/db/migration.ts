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

import { jobDecorator, JobRegistry } from "../../../declare/job.ts";
import type { JobHandler, RegisteredJob } from "../../../declare/job.ts";

/** The body of a job replayed at every start after the first. Throwing stops a runner. */
export type MigrationDbHandler = JobHandler;

/** A declared database job, and the handler that runs it on every start after the first. */
export type RegisteredMigrationDb = RegisteredJob;

/** Every `MigrationDB` declared so far, indexed by name: the class it was written on. */
export const migrationDbRegistry: JobRegistry = new JobRegistry("migration-db");

/**
 * Marks a method as a job replayed at **every start after the first** — the code counterpart of
 * the `migrations` moment `Deploy({ db: { migrations: ... } })` declares in SQL, for a change a
 * schema entry cannot express on its own: backfilling a column just added, translating rows into
 * a shape a migration's own SQL only set up.
 *
 * ```ts ignore
 * @DB()
 * export class Backfills {
 *   @MigrationDB()
 *   async populateDisplayName(): Future<void> {
 *     await database.internal_t__users().update({ displayName: sql`coalesce(display_name, email)` });
 *   }
 * }
 * ```
 *
 * `@InitDB` is for the one-time work a fresh database cannot do without. `@MigrationDB` is for
 * what has to run again on every start after that, the same way `migrations.sql` files are
 * replayed rather than run once.
 *
 * The class it lives on must carry `@DB()`, for the same reason `@InitDB` needs it: an instance
 * has to exist for the method to run bound to `this`. Only one `@MigrationDB` per class, keyed by
 * the class's own name, the same rule `@InitDB` follows.
 *
 * Registering here does not run anything: like `@Init`/`@Run` in `lifecycle/`, this only fills
 * `migrationDbRegistry`. Playing what it holds, on every start after the first, is a separate
 * concern this module does not carry.
 *
 * @throws {Error} When applied to anything but an instance method.
 */
export function MigrationDB() {
  return jobDecorator(migrationDbRegistry, "MigrationDB");
}
