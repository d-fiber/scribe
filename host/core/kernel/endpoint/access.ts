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

import { RequestIdentity } from "@scribe/core/kernel/identity/request_identity.ts";
import { InternalSecretFirewall } from "@scribe/core/kernel/identity/firewall/internal.ts";

export enum Caller {
  Anonymous = "anonymous",
  User = "user",
  Admin = "admin",
  Service = "service",
  Webhook = "webhook",
}

export function callersOf(
  declared: Caller | readonly Caller[],
): readonly Caller[] {
  return Array.isArray(declared) ? declared : [declared as Caller];
}

export async function isAllowed(
  callers: readonly Caller[],
  webhookVerified: boolean,
): Promise<boolean> {
  if (callers.includes(Caller.Anonymous)) return true;

  for (const caller of callers) {
    if (await satisfies(caller, webhookVerified)) return true;
  }

  return false;
}

function satisfies(caller: Caller, webhookVerified: boolean): Promise<boolean> {
  switch (caller) {
    case Caller.Anonymous:
      return Promise.resolve(true);
    case Caller.Webhook:
      return Promise.resolve(webhookVerified);
    case Caller.Service:
      return Promise.resolve(InternalSecretFirewall.verify());
    case Caller.User:
      return RequestIdentity.isUser();
    case Caller.Admin:
      return RequestIdentity.isAdmin();
  }
}
