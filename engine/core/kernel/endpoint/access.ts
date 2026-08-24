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

import type { Caller } from "@scribe/alchemy/route";
import { RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { InternalSecretFirewall } from "@scribe/core/kernel/identity/firewall/internal.ts";

/**
 * Whether any of `callers` is satisfied by the call being answered.
 *
 * @remarks
 * The four ways of proving a call come from the vocabulary, and what proves them lives here,
 * because each one reaches something only a running host has: the session behind the bearer, the
 * internal secret, the signature a webhook was verified with.
 *
 * A route naming several callers is answered when any one of them holds, which is why an
 * `anonymous` in the list makes the rest moot.
 *
 * `authenticated` is somebody holding a session, an administrator included. Being an administrator
 * is a fact about the account and not a way of proving a call, so it is checked where roles and
 * permissions are, never here.
 */
export async function isAllowed(
  callers: readonly Caller[],
  webhookVerified: boolean,
): Promise<boolean> {
  if (callers.includes("anonymous")) return true;

  for (const caller of callers) {
    if (await satisfies(caller, webhookVerified)) return true;
  }

  return false;
}

/** Whether this one way of proving a call is satisfied by the call being answered. */
function satisfies(caller: Caller, webhookVerified: boolean): Promise<boolean> {
  switch (caller) {
    case "anonymous":
      return Promise.resolve(true);
    case "webhook":
      return Promise.resolve(webhookVerified);
    case "service":
      return Promise.resolve(InternalSecretFirewall.verify());
    case "authenticated":
      return RequestIdentity.isConnected();
  }
}
