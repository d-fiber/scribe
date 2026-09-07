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

import { Lifecycle } from "../../../wiring/lifecycle/lifecycle.ts";

/**
 * Marks a class as one this framework instantiates itself, the moment the class is evaluated —
 * the database counterpart of `@Lifecycle`, for a class whose only concern is registering the
 * code a package runs at one of Postgres's moments.
 *
 * @remarks
 * `@DB` does exactly what `@Lifecycle` does, and delegates to it: nothing about `@InitDB`,
 * `@MigrationDB` or `@ProvisioningDB` actually requires a decorator of its own, since any of them
 * would build the instance they need bound to `@Lifecycle` alone. The separate name exists so a
 * class that only carries database jobs reads as one at a glance, the way `@Init`/`@Run` already
 * read as generic jobs under a bare `@Lifecycle`.
 *
 * ```ts ignore
 * @DB()
 * export class Seeds {
 *   @InitDB()
 *   async createTables(): Future<void> { ... }
 *
 *   @MigrationDB()
 *   async addColumn(): Future<void> { ... }
 *
 *   @ProvisioningDB()
 *   async createRole(): Future<void> { ... }
 * }
 * ```
 *
 * A project or a package may write as many `@DB` classes as it likes. The constructor must take
 * no arguments: this decorator is the only caller, and it has nothing to pass one. A class with
 * state to share between its own methods keeps it on `this`, set in the constructor body.
 */
export function DB(): ReturnType<typeof Lifecycle> {
  return Lifecycle();
}
