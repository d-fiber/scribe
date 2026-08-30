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

import { Caller } from "../contracts/access.ts";
import type { Contribution } from "../routing/contribution.ts";

export interface StandardNode {
  /** The reserved node name this standard declaration answers for. */
  readonly name: string;

  /** The caller kind every route under this node is restricted to, before any layer narrows it further. */
  readonly caller: Caller;

  /** Whether this node is reachable directly, rather than only through another node's dispatch. */
  readonly public: boolean;

  /** Whether every route under this node requires an already-verified webhook. `null` when it doesn't decide. */
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
