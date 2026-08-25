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
import type { Contribution } from "../route/mount/contribution.ts";
import type { Middleware, NodeRoot } from "../route/mount/middleware.ts";
import { standardContribution, standardNode } from "./standard.ts";

/** What declaring a node takes. */
export interface NodeInput {
  /** What the node answers to, which is the first segment of every path it holds. */
  readonly name: string;

  /** Whether the node is reachable from outside the deployment, or only from inside it. */
  readonly public: boolean;

  /** What the node is for, in one sentence, for whatever writes its documentation. */
  readonly description?: string;

  /** The middleware at the top of the node, which every one of its routes passes through. */
  readonly node?: NodeRoot;

  /**
   * Middlewares sitting above the root, outermost first.
   *
   * They are declared here rather than in the tree because they hold for the whole node and are
   * written nowhere in it: a project that wants one for a folder writes a `_middleware.ts` instead.
   */
  readonly middleware?: UnmodifiableList<Middleware>;
}

/**
 * One node of a worker: a name, and what every route under it inherits.
 *
 * @remarks
 * A node is the outermost layer of {@link Contribution} a route sees, and the only one written
 * outside the route tree. What it declares comes from three places, and {@link layers} is where
 * their order is decided.
 *
 * A node whose name is one of the standard five starts from what that name means, so declaring
 * `app` already says the caller is a user without a line being written for it.
 */
export class Node {
  /**
   * Declares the node `input` describes.
   *
   * @param input - Everything the node says about itself, kept as it was given.
   */
  constructor(readonly input: NodeInput) {}

  /** What this node answers to. */
  get name(): string {
    return this.input.name;
  }

  /** Whether this node is reachable from outside the deployment. */
  get public(): boolean {
    return this.input.public;
  }

  /** What this node is for, or null when it said nothing. */
  get description(): string | null {
    return this.input.description ?? null;
  }

  /**
   * Everything this node declares, outermost layer first.
   *
   * @remarks
   * The order is what settles a disagreement, since the last layer to say something wins. What the
   * name means comes first and is therefore the easiest to override, then the middlewares given
   * here, then the root of the node, which is the closest to the routes and has the last word.
   */
  layers(): UnmodifiableList<Contribution> {
    const standard = standardNode(this.input.name);

    return [
      ...(standard ? [standardContribution(standard)] : []),
      ...(this.input.middleware ?? []).map((middleware) => middleware.contribution()),
      ...(this.input.node ? [this.input.node.contribution()] : []),
    ];
  }
}
