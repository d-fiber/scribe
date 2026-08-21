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
