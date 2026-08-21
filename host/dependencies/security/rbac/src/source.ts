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

import { Tables } from "@scribe/foundation/lib/src/database/gen/tables.ts";
import type { AdminRbacSource } from "@scribe/core/contracts/rbac.ts";
import { PostgrestClients } from "@scribe/foundation/lib/src/database/client.ts";

export class DatabaseAdminRbacSource implements AdminRbacSource {
  #db: Tables | null = null;

  async roleOf(adminId: string): Promise<string | null> {
    const admin = await this.#database()
      .internal_t__admin_users()
      .select((s) => ({ role: s.role }))
      .where((f) => f.admin_id.eq(adminId))
      .getOne();
    return admin?.role ?? null;
  }

  async permissionsOf(role: string): Promise<string[]> {
    const permissions = await this.#database()
      .internal_t__admin_users_role_permissions()
      .select((s) => ({ permission: s.permission }))
      .where((f) => f.role.eq(role))
      .get();
    return permissions.map((p) => p.permission);
  }

  // Building a client here instead of asking the factory would read the environment directly,
  // and so would step around the settings slot a test fills — the calls would go to the real
  // rest instance rather than to the mock, without anything saying so.
  #database(): Tables {
    return (this.#db ??= new Tables(PostgrestClients.service()));
  }
}
