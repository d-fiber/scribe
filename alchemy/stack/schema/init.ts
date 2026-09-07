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

import { jobDecorator, JobRegistry } from "../../wiring/declare/job.ts";
import type { JobHandler, RegisteredJob } from "../../wiring/declare/job.ts";

/** The body of a one-time database job. Throwing stops a runner before it tracks this job as done. */
export type InitDbHandler = JobHandler;

/** A declared one-time database job, and the handler that runs it. */
export type RegisteredInitDb = RegisteredJob;

/** Every `InitDB` declared so far, indexed by name — the key a runner tracks it as having run under. */
export const initDbRegistry: JobRegistry = new JobRegistry("init-db");

/**
 * Marks a method as a job that runs once, ever, before any of a package's own schema exists —
 * the code counterpart of the `init` moment `Deploy({ db: { init: ... } })` declares in SQL, for
 * one-time database work no schema entry covers: seeding a row whose value has to be generated,
 * calling out to a service to mint a credential a first table depends on.
 *
 * ```ts ignore
 * @DB()
 * export class Seeds {
 *   @InitDB()
 *   async seedDefaultAdmin(): Future<void> {
 *     await database.internal_t__admin_users().insertOne({ email: "admin@example.com" });
 *   }
 * }
 * ```
 *
 * The class it lives on must carry `@DB()`, which is what builds the instance this method needs
 * to run bound to `this`. A project or a package may write as many `@DB` classes as it likes,
 * each with its own `@InitDB` — but only one per class: the name it registers under is the
 * class's own name, so a second `@InitDB` on the same class collides with the first, the same way
 * a second `new Cron(...)` under a name already taken would.
 *
 * Registering here does not run anything: like `@Init`/`@Run` in `lifecycle/`, this only fills
 * `initDbRegistry`. Playing what it holds, once per stack and before a package's own `init`
 * schema, is a separate concern this module does not carry.
 *
 * @throws {Error} When applied to anything but an instance method.
 */
export function InitDB() {
  return jobDecorator(initDbRegistry, "InitDB");
}
