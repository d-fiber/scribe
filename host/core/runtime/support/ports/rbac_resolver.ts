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

import type { AdminRbac, AdminRbacSource } from "@scribe/core/contracts/rbac.ts";
import { Time } from "@scribe/core/contracts/common/time.ts";
import { Valkery } from "@scribe/foundation/src/valkery/valkery.ts";

export class AdminRbacResolver {
  private static readonly _cache = new Valkery<AdminRbac>({ key: "identity:rbac", ttl: Time.minutes(5) });
  private static _source: AdminRbacSource | null = null;

  static use(source: AdminRbacSource): void {
    this._source = source;
  }

  static async resolve(adminId: string): Promise<AdminRbac | null> {
    const cached = await this._cache.get(adminId);
    if (cached !== null) return cached;

    const source = this._requireSource();
    const role = await source.roleOf(adminId);
    if (role === null) return null;

    const rbac: AdminRbac = {
      role,
      permissions: await source.permissionsOf(role),
    };
    await this._cache.add(adminId, rbac);
    return rbac;
  }

  static invalidate(adminId?: string): Promise<void> {
    return adminId ? this._cache.delete(adminId) : this._cache.clear();
  }

  private static _requireSource(): AdminRbacSource {
    if (this._source === null) {
      throw new Error(
        "[rbac-resolver] no AdminRbacSource registered: call AdminRbacResolver.use() at boot.",
      );
    }
    return this._source;
  }
}
