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

import type { UnmodifiableList } from "../../../value/list.ts";

/**
 * A route or middleware file as it was imported, before anything is made of it.
 *
 * @remarks
 * It is written as plain fields rather than a known shape because the generator hands over whatever
 * the file exported. What of it is an endpoint or a middleware is decided when the node is
 * compiled, not here.
 */
export type DiscoveredModule = Readonly<Record<string, unknown>>;

/** A route file the generator found, and where it sits. */
export interface DiscoveredRoute {
  /** The node this route answers for. */
  readonly node: string;

  /** The path it answers, as it is written in the URL. */
  readonly path: string;

  /** Where the file sits on disk, which is what a refusal names when the file is wrong. */
  readonly file: string;

  /** What the file exported, the endpoint among it. */
  readonly module: DiscoveredModule;

  /**
   * Every middleware file between the root of the node and this route, root first.
   *
   * The order is the one {@link merge} and {@link wrapAll} read, so a layer written closer to the
   * root sees a call before the ones under it.
   */
  readonly branches: UnmodifiableList<DiscoveredModule>;
}

/**
 * A `_logs.ts` the generator found, and the node it answers for.
 *
 * `node` is `null` for `lib/_logs.ts`, the sink that takes what no node claimed.
 * A node without a `_logs.ts` simply has no entry here, which is what makes
 * "declare nothing and nothing is delivered" the default rather than a branch.
 */
export interface DiscoveredLogSink {
  /** The node this sink takes the entries of, or null for the one that takes what no node claimed. */
  readonly node: string | null;

  /** Where the file sits on disk, which is what a refusal names when the file is wrong. */
  readonly file: string;

  /** What the file exported, the sink among it. */
  readonly module: DiscoveredModule;
}
