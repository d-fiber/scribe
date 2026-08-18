// Copyright (C) 2026 Fiber
//
// This file is part of scribe and is made available under the PolyForm Shield
// License 1.0.0. The full terms are in the LICENSE file at the root of this
// repository, and at https://polyformproject.org/licenses/shield/1.0.0
//
// What you may do:
// - Use this software for any purpose, including commercially, and build and
//   sell your own products on top of it.
// - Change it, and create new works based on it.
// - Distribute copies of it, with or without your changes.
//
// The one thing you may not do:
// - Use it to provide any product that competes with scribe, or with any
//   product Fiber or its affiliates provide using scribe. Products compete
//   even when they are offered free of charge, through a different kind of
//   interface, or for a different technical platform.
//
// If you pass this software on:
// - Anyone who receives any part of it from you must also receive these terms,
//   or the URL above, together with the "Required Notice" line carried by the
//   LICENSE file.
//
// Disclaimer:
// AS FAR AS THE LAW ALLOWS, THIS SOFTWARE COMES AS IS, WITHOUT ANY WARRANTY OR
// CONDITION, AND THE LICENSOR WILL NOT BE LIABLE TO YOU FOR ANY DAMAGES ARISING
// OUT OF THESE TERMS OR THE USE OR NATURE OF THE SOFTWARE, UNDER ANY KIND OF
// LEGAL CLAIM.
//
// This header is a summary written for convenience. Where it differs from the
// LICENSE file, the LICENSE file governs.

import { Tables } from "@scribe/foundation/src/database/gen/tables.ts";
import type { AdminRbacSource } from "@scribe/core/contracts/rbac.ts";
import { PostgrestClients } from "@scribe/foundation/src/database/client.ts";

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
