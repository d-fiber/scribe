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

import { Caller } from "../contracts/access.ts";
import type { Contribution } from "../routing/contribution.ts";

export interface StandardNode {
  readonly name: string;
  readonly caller: Caller;
  readonly public: boolean;
  readonly webhookVerified: boolean | null;
}

const STANDARD_NODES: readonly StandardNode[] = [
  { name: "public", caller: Caller.Anonymous, public: true, webhookVerified: null },
  { name: "app", caller: Caller.User, public: true, webhookVerified: null },
  { name: "admin", caller: Caller.Admin, public: true, webhookVerified: null },
  { name: "services", caller: Caller.Service, public: false, webhookVerified: null },
  { name: "webhook", caller: Caller.Webhook, public: true, webhookVerified: true },
];

const byName = new Map(STANDARD_NODES.map((node) => [node.name, node]));

export function standardNode(name: string): StandardNode | null {
  return byName.get(name) ?? null;
}

export function standardNodeNames(): readonly string[] {
  return STANDARD_NODES.map((node) => node.name);
}

export function standardContribution(node: StandardNode): Contribution {
  return {
    access: node.caller,
    permissions: [],
    rateLimit: null,
    rateLimitKey: null,
    needs: [],
    webhookVerified: node.webhookVerified,
    wrap: null,
  };
}
