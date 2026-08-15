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

import { SignOutScope } from "@scribe/core/contracts/account.ts";
import { IdentityRevocation } from "@scribe/core/runtime/redis/identity_revocation.ts";
import { AccountRoleResolver } from "./account.ts";
import { AuthCache } from "./cache.ts";
import { goTrue } from "./gotrue/gotrue_client.ts";

export class AccountRevocation {
  static async sessions(
    userId: string,
    accessToken: string | null,
  ): Promise<void> {
    await Promise.all([
      accessToken ? this.session(accessToken, SignOutScope.Global) : Promise.resolve(),
      this.caches(userId),
    ]);
  }

  static async session(
    accessToken: string,
    scope: SignOutScope = SignOutScope.Local,
  ): Promise<void> {
    try {
      const res = await goTrue.session.logout(accessToken, scope);
      if (!res.ok) {
        console.error(
          `[account-revocation] ${scope} sign-out rejected by gotrue: ${res.error.code} - ${res.error.message}`,
        );
      }
    } catch (e) {
      console.error(`[account-revocation] ${scope} sign-out failed:`, e);
    }
  }

  static async caches(userId: string): Promise<void> {
    await Promise.all([
      IdentityRevocation.revoke(userId),
      AccountRoleResolver.invalidate(userId),
      AuthCache.session.invalidate(userId),
      AuthCache.intra.invalidate(userId),
      AuthCache.devices.invalidate(userId),
      AuthCache.device.invalidateAll(userId),
      AuthCache.hardware.invalidateAll(userId),
    ]);
  }
}
