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

import type { UnmodifiableList } from "../../value/list.ts";
import type { Caller } from "../route/access.ts";
import type { Contribution } from "../route/mount/contribution.ts";

/** One of the five node names that already mean something. */
export interface StandardNode {
  /** The name a project writes to get this. */
  readonly name: string;

  /** Who calls this node, unless a layer beneath says otherwise. */
  readonly caller: Caller;

  /** Whether this node is reachable from outside the deployment. */
  readonly public: boolean;

  /** Whether an incoming hook must already be checked, or null when the name says nothing. */
  readonly webhookVerified: boolean | null;
}

/**
 * The five names a project does not have to explain.
 *
 * @remarks
 * They exist because every deployment ends up with the same five audiences, and writing the access
 * of each one by hand is five chances to write it wrong. A project keeps the name and inherits what
 * it means; a project that wants something else names its node something else.
 */
const STANDARD_NODES: UnmodifiableList<StandardNode> = [
  { name: "public", caller: "anonymous", public: true, webhookVerified: null },
  { name: "app", caller: "authenticated", public: true, webhookVerified: null },
  { name: "admin", caller: "authenticated", public: true, webhookVerified: null },
  { name: "services", caller: "service", public: false, webhookVerified: null },
  { name: "webhook", caller: "webhook", public: true, webhookVerified: true },
];

/** The five, reachable by the name a project writes. */
const byName = new Map(STANDARD_NODES.map((node) => [node.name, node]));

/** What `name` means as a standard node, or null when it is a name a project chose itself. */
export function standardNode(name: string): StandardNode | null {
  return byName.get(name) ?? null;
}

/** The five names, in the order they are declared here. */
export function standardNodeNames(): UnmodifiableList<string> {
  return STANDARD_NODES.map((node) => node.name);
}

/**
 * What `node` declares, as the outermost layer of everything beneath it.
 *
 * A standard name settles who calls, and nothing else. How often a route may be called is left
 * open on purpose: there is no number that is right for every route of an audience, and a route
 * without one is refused rather than given a default nobody chose.
 */
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
