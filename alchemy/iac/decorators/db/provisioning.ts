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

/** The body of a one-time provisioning job. Throwing stops a runner before it tracks this job as done. */
export type ProvisioningDbHandler = JobHandler;

/** A declared one-time provisioning job, and the handler that runs it. */
export type RegisteredProvisioningDb = RegisteredJob;

/** Every `ProvisioningDB` declared so far, indexed by name — the key a runner tracks it as having run under. */
export const provisioningDbRegistry: JobRegistry = new JobRegistry("provisioning-db");

/**
 * Marks a method as a job that runs once, ever, before `@InitDB` and before a package's own
 * schema exists — the code counterpart of the `provisioning` moment `Deploy({ db: {
 * provisioning: ... } })` declares in SQL, for the infrastructure a package's own tables will
 * depend on but that a `Role` or an `Extension` cannot express: reaching a service to reserve a
 * name, minting a credential nothing in the schema itself needs to know about yet.
 *
 * ```ts ignore
 * @DB()
 * export class Bootstrap {
 *   @ProvisioningDB()
 *   async reserveBucketName(): Future<void> {
 *     await externalRegistry.reserve(setting("bucketName"));
 *   }
 * }
 * ```
 *
 * The class it lives on must carry `@DB()`, for the same reason `@InitDB` needs it: an instance
 * has to exist for the method to run bound to `this`. Only one `@ProvisioningDB` per class, keyed
 * by the class's own name, the same rule `@InitDB` follows.
 *
 * Registering here does not run anything: like `@Init`/`@Run` in `lifecycle/`, this only fills
 * `provisioningDbRegistry`. Playing what it holds, once per stack and before a package's own
 * `init` schema, is a separate concern this module does not carry.
 *
 * @throws {Error} When applied to anything but an instance method.
 */
export function ProvisioningDB() {
  return jobDecorator(provisioningDbRegistry, "ProvisioningDB");
}
