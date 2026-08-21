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

import type {
  SessionAdmin,
  SessionUser,
} from "@scribe/core/contracts/account.ts";
import { RequestScope } from "@scribe/core/runtime/scope.ts";

export type RequestUser = SessionUser | SessionAdmin | null;

const _RESOLVED_KEY = "identity:user:resolved";
const _PENDING_KEY = "identity:user:pending";

export class RequestIdentityCache {
  static resolved(): RequestUser | undefined {
    return RequestScope.cache.get<RequestUser>(_RESOLVED_KEY);
  }

  static seed(user: RequestUser): void {
    RequestScope.cache.set(_RESOLVED_KEY, user);
  }

  static async remember(
    resolve: () => Promise<RequestUser>,
  ): Promise<RequestUser> {
    const resolved = this.resolved();
    if (resolved !== undefined) return resolved;

    const pending = RequestScope.cache.get<Promise<RequestUser>>(_PENDING_KEY);
    if (pending !== undefined) {
      const user = await pending;
      RequestScope.cache.set(_RESOLVED_KEY, user);
      return user;
    }

    const promise = resolve();
    RequestScope.cache.set(_PENDING_KEY, promise);
    const user = await promise;
    RequestScope.cache.set(_RESOLVED_KEY, user);
    return user;
  }
}

export function currentIdentity(): RequestUser {
  return RequestIdentityCache.resolved() ?? null;
}
