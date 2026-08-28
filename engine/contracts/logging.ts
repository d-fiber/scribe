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

import type { Future } from "@scribe/alchemy";
import type { LoggedEntry } from "@scribe/alchemy/observe";

/**
 * Where the project decided its own entries should go, when it decided at all.
 *
 * The port exists because the decision lives in project code -- a `_logs.ts`
 * running in the worker -- while the entries are raised in `kernel/`, which
 * cannot import `project/`. The host asks two questions and hands over a batch;
 * everything about how a sink was declared stays on the other side.
 *
 * It is the only destination there is. A host that finds no sink drops the
 * entry rather than falling back on one of its own: what a project's logs are
 * worth keeping is the project's decision, and the framework taking it back
 * would put every deployment on a path nobody asked for.
 */
export interface LogRouting {
  /**
   * The node that owns `path`, or `null` when no declared node does.
   *
   * The host reads the node off the request path rather than being told: a
   * node is mounted under its own name, so the first segment is the answer.
   */
  nodeOf(path: string): string | null;

  /**
   * Whether a sink takes delivery of what `node` produced.
   *
   * `false` means the entry goes nowhere: it is neither kept nor printed. A
   * node answers `false` when neither it nor the root of the project declared a
   * `_logs.ts`, which is a project that has not asked for its logs.
   */
  claims(node: string | null): boolean;

  /** Hands a batch to the sink that claimed it. */
  deliver(node: string | null, entries: readonly LoggedEntry[]): Future<void>;
}
